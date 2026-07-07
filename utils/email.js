import nodemailer from 'nodemailer';

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT) || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user) {
    return null;
  }
  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
  return transporter;
}

export async function sendMail({ to, subject, html, text }) {
  const t = getTransporter();
  if (!t) {
    console.warn('[email] SMTP not configured; skipping send to', to);
    return { skipped: true };
  }
  const from = process.env.MAIL_FROM || `"Aromacandle" <${process.env.SMTP_USER}>`;
  await t.sendMail({ from, to, subject, html, text });
  return { sent: true };
}

export function otpEmailHtml(code) {
  return `
  <!DOCTYPE html><html><body style="font-family:Georgia,serif;background:#F5F0E8;padding:24px;color:#3D3535;">
  <div style="max-width:480px;margin:auto;background:#fff;padding:32px;border-radius:12px;">
    <h1 style="color:#8AAE8A;font-size:22px;">Verify your email</h1>
    <p>Your one-time code is:</p>
    <p style="font-size:32px;letter-spacing:8px;font-weight:bold;">${code}</p>
    <p style="font-size:14px;color:#666;">This code expires in 15 minutes.</p>
  </div></body></html>`;
}

export function orderConfirmationHtml(order, items, address) {
  const rows = items
    .map((i) => {
      const name = i.Product?.name || i.product?.name || 'Item';
      return `<tr><td>${name}</td><td>${i.quantity}</td><td>₹${i.price}</td></tr>`;
    })
    .join('');
  return `
  <!DOCTYPE html><html><body style="font-family:sans-serif;background:#F5F0E8;padding:24px;color:#3D3535;">
  <div style="max-width:560px;margin:auto;background:#fff;padding:32px;border-radius:12px;">
    <h1 style="color:#8AAE8A;">Thank you for your order</h1>
    <p>Order #${order.id}</p>
    <p>${address.name}, ${address.street}, ${address.city}, ${address.state} ${address.pincode}</p>
    <table style="width:100%;border-collapse:collapse;margin-top:16px;">
      <thead><tr><th align="left">Product</th><th>Qty</th><th>Price</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <p style="margin-top:16px;"><strong>Total: ₹${order.total}</strong></p>
  </div></body></html>`;
}
