import bcrypt from 'bcryptjs';
import { body } from 'express-validator';
import { Op } from 'sequelize';
import { User } from '../models/index.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken, hashToken } from '../utils/jwt.js';
import { sendMail, otpEmailHtml } from '../utils/email.js';
import { promises as dns } from 'dns' ;
const BCRYPT_ROUNDS = 12;

async function isEmailDeliverable(email) {
  const domain = email.split('@')[1];
  try {
    const mxRecords = await dns.resolveMx(domain);
    return mxRecords && mxRecords.length > 0;
  } catch (err) {
    console.error('DNS lookup failed for domain:', domain, err);
    return false;
  }
}

export const registerValidators = [
  body('name').trim().isLength({ min: 2, max: 120 }).escape(),
  body('email').isEmail(),
  body('phone').trim().matches(/^[0-9]{10,15}$/),
  body('password').isLength({ min: 8, max: 128 }),
];

export async function register(req, res) {
  const { name, password, phone } = req.body;
  
  const email = req.body.email.toLowerCase();

  const deliverable = await isEmailDeliverable(email);

  console.log(`Email deliverability for ${email}:`, deliverable);
  if (!deliverable) {
    return res.status(400).json({ message: 'Email domain is not deliverable' });
  }
  
  const existing = await User.findOne({ where: { email } });
  if (existing) {
    return res.status(409).json({ message: 'Email already registered' });
  }
  const hashed = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const code = String(Math.floor(100000 + Math.random() * 900000));
  const otp_hash = await bcrypt.hash(code, BCRYPT_ROUNDS);
  const otp_expires_at = new Date(Date.now() + 15 * 60 * 1000);
  const user = await User.create({
    name,
    email,
    password: hashed,
    phone: phone || null,
    email_verified: false,
    otp_hash,
    otp_expires_at,
    role: 'user',
  });
  const resp=await sendMail({
    to: email,
    subject: 'Verify your Aromacandle account',
    html: otpEmailHtml(code),
    text: `Your verification code is ${code}. It expires in 15 minutes.`,
  });
  console.log("mail response after sending",resp);
  
  return res.status(201).json({
    message: 'Account created. Check your email for the verification code.',
    userId: user.id,
    resp:resp,
  });
}

export const verifyOtpValidators = [
  body('email').isEmail(),
  body('otp').isLength({ min: 6, max: 6 }).isNumeric(),
];

export async function verifyOtp(req, res) {
  const { email, otp } = req.body;
  const user = await User.findOne({ where: { email } });
  if (!user || !user.otp_hash) {
    return res.status(400).json({ message: 'Invalid request' });
  }
  if (user.otp_expires_at && new Date(user.otp_expires_at) < new Date()) {
    return res.status(400).json({ message: 'Code expired. Request a new one.' });
  }
  const match = await bcrypt.compare(String(otp), user.otp_hash);
  if (!match) {
    return res.status(400).json({ message: 'Invalid code' });
  }
  await user.update({
    email_verified: true,
    otp_hash: null,
    otp_expires_at: null,
  });
  return res.json({ message: 'Email verified. You can sign in now.' });
}

export const resendOtpValidators = [body('email').isEmail()];

export async function resendOtp(req, res) {
  const { email } = req.body;
  const user = await User.findOne({ where: { email } });
  if (!user) {
    return res.json({ message: 'If the email exists, a code was sent.' });
  }
  if (user.email_verified) {
    return res.status(400).json({ message: 'Email already verified' });
  }
  const code = String(Math.floor(100000 + Math.random() * 900000));
  const otp_hash = await bcrypt.hash(code, BCRYPT_ROUNDS);
  await user.update({
    otp_hash,
    otp_expires_at: new Date(Date.now() + 15 * 60 * 1000),
  });
  await sendMail({
    to: email,
    subject: 'Your Aromacandle verification code',
    html: otpEmailHtml(code),
    text: `Your verification code is ${code}.`,
  });
  return res.json({ message: 'If the email exists, a code was sent.' });
}

export const loginValidators = [
  body('identifier').trim().notEmpty(),
  body('password').notEmpty(),
];

export async function login(req, res) {
  const { identifier, password } = req.body;
  const normalized = String(identifier).trim();
  const user = await User.findOne({
    where: {
      [Op.or]: [{ email: normalized.toLowerCase() }, { phone: normalized }],
    },
  });
  if (!user) {
    return res.status(401).json({ message: 'Invalid phone/email or password' });
  }
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) {
    return res.status(401).json({ message: 'Invalid phone/email or password' });
  }
  if (!user.email_verified) {
    return res.status(403).json({ message: 'Please verify your email first.' });
  }
  const accessToken = signAccessToken({ sub: user.id, role: user.role });
  const refreshToken = signRefreshToken({ sub: user.id });
  const refresh_token_hash = hashToken(refreshToken);
  await user.update({ refresh_token_hash });
  return res.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
    },
    accessToken,
    refreshToken,
  });
}

export const refreshValidators = [body('refreshToken').notEmpty()];

export async function refresh(req, res) {
  const { refreshToken } = req.body;
  let decoded;
  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch {
    return res.status(401).json({ message: 'Invalid refresh token' });
  }
  const user = await User.findByPk(decoded.sub);
  if (!user || !user.refresh_token_hash) {
    return res.status(401).json({ message: 'Session expired' });
  }
  const h = hashToken(refreshToken);
  if (h !== user.refresh_token_hash) {
    return res.status(401).json({ message: 'Session expired' });
  }
  const accessToken = signAccessToken({ sub: user.id, role: user.role });
  const newRefresh = signRefreshToken({ sub: user.id });
  await user.update({ refresh_token_hash: hashToken(newRefresh) });
  return res.json({ accessToken, refreshToken: newRefresh });
}

export async function logout(req, res) {
  const user = await User.findByPk(req.user.id);
  if (user) await user.update({ refresh_token_hash: null });
  return res.json({ message: 'Logged out' });
}

export async function me(req, res) {
  const user = await User.findByPk(req.user.id, {
    attributes: { exclude: ['password', 'otp_hash', 'refresh_token_hash'] },
  });
  return res.json(user);
}
