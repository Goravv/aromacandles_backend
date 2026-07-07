import { verifyAccessToken } from '../utils/jwt.js';
import { User } from '../models/index.js';

export async function authenticate(req, res, next) {
  try {
    const auth = req.headers.authorization;
    if (!auth?.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    const token = auth.slice(7);
    const decoded = verifyAccessToken(token);
    const user = await User.findByPk(decoded.sub, {
      attributes: { exclude: ['password', 'otp_hash', 'refresh_token_hash'] },
    });
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

export async function optionalAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) {
    req.user = null;
    return next();
  }
  try {
    const token = auth.slice(7);
    const decoded = verifyAccessToken(token);
    const user = await User.findByPk(decoded.sub, {
      attributes: { exclude: ['password', 'otp_hash', 'refresh_token_hash'] },
    });
    req.user = user;
  } catch {
    req.user = null;
  }
  next();
}

export function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
}
