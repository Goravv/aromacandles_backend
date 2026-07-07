import Razorpay from 'razorpay';

let instance = null;

export function getRazorpay() {
  const key = process.env.RAZORPAY_KEY_ID;
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!key || !secret) {
    return null;
  }
  if (!instance) {
    instance = new Razorpay({ key_id: key, key_secret: secret });
  }
  return instance;
}
