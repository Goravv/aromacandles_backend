import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { authenticate, requireAdmin, optionalAuth } from '../middleware/auth.js';
import { handleValidation } from '../middleware/validate.js';
import {
  uploadProductImages,
  uploadBlogImage,
} from '../middleware/upload.js';

import * as auth from '../controllers/authController.js';
import * as products from '../controllers/productController.js';
import * as categories from '../controllers/categoryController.js';
import * as cart from '../controllers/cartController.js';
import * as addresses from '../controllers/addressController.js';
import * as orders from '../controllers/orderController.js';
import * as wishlist from '../controllers/wishlistController.js';
import * as reviews from '../controllers/reviewController.js';
import * as coupons from '../controllers/couponController.js';
import * as blogs from '../controllers/blogController.js';
import * as shipping from '../controllers/shippingController.js';
import * as customOrders from '../controllers/customOrderController.js';
import * as search from '../controllers/searchController.js';
import * as admin from '../controllers/adminController.js';
import * as zones from '../controllers/shippingZoneController.js';
import * as uploads from '../controllers/uploadController.js';

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.AUTH_RATE_LIMIT_MAX) || 60,
  standardHeaders: true,
  legacyHeaders: false,
});

router.get('/health', (_req, res) => res.json({ ok: true }));

router.post(
  '/auth/register',
  authLimiter,
  auth.registerValidators,
  handleValidation,
  auth.register
);
router.post(
  '/auth/verify-otp',
  authLimiter,
  auth.verifyOtpValidators,
  handleValidation,
  auth.verifyOtp
);
router.post(
  '/auth/resend-otp',
  authLimiter,
  auth.resendOtpValidators,
  handleValidation,
  auth.resendOtp
);
router.post(
  '/auth/login',
  authLimiter,
  auth.loginValidators,
  handleValidation,
  auth.login
);
router.post(
  '/auth/refresh',
  authLimiter,
  auth.refreshValidators,
  handleValidation,
  auth.refresh
);
router.post('/auth/logout', authenticate, auth.logout);
router.get('/auth/me', authenticate, auth.me);

router.get('/products', products.listValidators, handleValidation, products.listProducts);
router.get('/products/featured', products.featured);
router.get('/products/:slug/related', products.related);
router.get('/products/:slug', products.getBySlug);

router.get('/categories', categories.listAll);

router.get('/search/suggest', search.suggest);

router.get('/blogs', blogs.listPublished);
router.get('/blogs/:slug', blogs.getBySlug);

router.post(
  '/shipping/quote',
  shipping.quoteValidators,
  handleValidation,
  shipping.quote
);

router.post(
  '/coupons/validate',
  coupons.validateValidators,
  handleValidation,
  coupons.validateCoupon
);

router.post(
  '/custom-orders',
  optionalAuth,
  customOrders.createValidators,
  handleValidation,
  customOrders.create
);

router.use(authenticate);

router.get('/cart', cart.getCart);
router.post('/cart', cart.addValidators, handleValidation, cart.addItem);
router.patch('/cart/:id', cart.updateItem);
router.delete('/cart/:id', cart.removeItem);
router.delete('/cart', cart.clearCart);

router.get('/addresses', addresses.list);
router.post('/addresses', addresses.addressValidators, handleValidation, addresses.create);
router.patch('/addresses/:id', addresses.addressValidators, handleValidation, addresses.update);
router.delete('/addresses/:id', addresses.remove);

router.get('/wishlist', wishlist.list);
router.post('/wishlist/:productId', wishlist.add);
router.delete('/wishlist/:id', wishlist.remove);
router.delete('/wishlist/product/:productId', wishlist.removeByProduct);

router.post(
  '/reviews',
  reviews.createValidators,
  handleValidation,
  reviews.create
);

router.post(
  '/orders/checkout',
  orders.checkoutValidators,
  handleValidation,
  orders.checkout
);
router.post(
  '/orders/verify-payment',
  orders.verifyValidators,
  handleValidation,
  orders.verifyPayment
);
router.post('/orders/payment-failed', orders.paymentFailed);
router.get('/orders', orders.myOrders);
router.get('/orders/:id', orders.getOrder);

router.use(requireAdmin);

router.get('/admin/dashboard', admin.dashboard);
router.get('/admin/orders', admin.listOrders);
router.patch('/admin/orders/:id/status', admin.updateOrderStatus);
router.get('/admin/orders/:id/invoice', admin.invoice);
router.get('/admin/customers', admin.listCustomers);
router.get('/admin/settings', admin.getSettings);
router.put('/admin/settings', admin.updateSettings);

router.get('/admin/products', products.adminList);
router.post(
  '/admin/products',
  products.adminCreateValidators,
  handleValidation,
  products.adminCreate
);
router.patch(
  '/admin/products/:id',
  products.adminUpdate
);
router.delete('/admin/products/:id', products.adminDelete);

router.post(
  '/admin/products/upload',
  uploadProductImages.array('images', 8),
  uploads.uploadProductImages
);

router.get('/admin/categories', categories.listAll);
router.post('/admin/categories', categories.adminCreate);
router.patch('/admin/categories/:id', categories.adminUpdate);
router.delete('/admin/categories/:id', categories.adminDelete);

router.get('/admin/coupons', coupons.adminList);
router.post('/admin/coupons', coupons.adminCreate);
router.patch('/admin/coupons/:id', coupons.adminUpdate);
router.delete('/admin/coupons/:id', coupons.adminDelete);

router.get('/admin/shipping-zones', zones.adminList);
router.post('/admin/shipping-zones', zones.adminCreate);
router.patch('/admin/shipping-zones/:id', zones.adminUpdate);
router.delete('/admin/shipping-zones/:id', zones.adminDelete);

router.get('/admin/blogs', blogs.adminList);
router.post('/admin/blogs', blogs.adminCreate);
router.patch('/admin/blogs/:id', blogs.adminUpdate);
router.delete('/admin/blogs/:id', blogs.adminDelete);
router.post(
  '/admin/blogs/upload-image',
  uploadBlogImage.single('image'),
  uploads.uploadBlogImage
);

router.get('/admin/custom-orders', customOrders.adminList);
router.patch('/admin/custom-orders/:id/status', customOrders.adminUpdateStatus);

router.delete('/admin/reviews/:id', reviews.adminDelete);

export default router;
