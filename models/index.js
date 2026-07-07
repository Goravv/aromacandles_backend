import User from './User.js';
import Address from './Address.js';
import Category from './Category.js';
import Product from './Product.js';
import ProductCategory from './ProductCategory.js';
import CartItem from './CartItem.js';
import Coupon from './Coupon.js';
import Order from './Order.js';
import OrderItem from './OrderItem.js';
import Review from './Review.js';
import Wishlist from './Wishlist.js';
import Blog from './Blog.js';
import ShippingZone from './ShippingZone.js';
import CustomOrder from './CustomOrder.js';
import Setting from './Setting.js';

User.hasMany(Address, { foreignKey: 'user_id' });
Address.belongsTo(User, { foreignKey: 'user_id' });

Category.hasMany(Category, { as: 'children', foreignKey: 'parent_id' });
Category.belongsTo(Category, { as: 'parent', foreignKey: 'parent_id' });

Product.belongsTo(Category, { foreignKey: 'category_id', as: 'primaryCategory' });
Category.hasMany(Product, { foreignKey: 'category_id' });

Product.belongsToMany(Category, {
  through: ProductCategory,
  foreignKey: 'product_id',
  otherKey: 'category_id',
  as: 'filterCategories',
});
Category.belongsToMany(Product, {
  through: ProductCategory,
  foreignKey: 'category_id',
  otherKey: 'product_id',
  as: 'filteredProducts',
});

User.hasMany(CartItem, { foreignKey: 'user_id' });
CartItem.belongsTo(User, { foreignKey: 'user_id' });
Product.hasMany(CartItem, { foreignKey: 'product_id' });
CartItem.belongsTo(Product, { foreignKey: 'product_id' });

User.hasMany(Order, { foreignKey: 'user_id' });
Order.belongsTo(User, { foreignKey: 'user_id' });
Order.belongsTo(Address, { foreignKey: 'address_id' });
Order.belongsTo(Coupon, { foreignKey: 'coupon_id' });
Order.hasMany(OrderItem, { foreignKey: 'order_id' });
OrderItem.belongsTo(Order, { foreignKey: 'order_id' });
OrderItem.belongsTo(Product, { foreignKey: 'product_id' });

User.hasMany(Review, { foreignKey: 'user_id' });
Review.belongsTo(User, { foreignKey: 'user_id' });
Product.hasMany(Review, { foreignKey: 'product_id' });
Review.belongsTo(Product, { foreignKey: 'product_id' });

User.hasMany(Wishlist, { foreignKey: 'user_id' });
Wishlist.belongsTo(User, { foreignKey: 'user_id' });
Product.hasMany(Wishlist, { foreignKey: 'product_id' });
Wishlist.belongsTo(Product, { foreignKey: 'product_id' });

User.hasMany(CustomOrder, { foreignKey: 'user_id' });
CustomOrder.belongsTo(User, { foreignKey: 'user_id' });

export {
  User,
  Address,
  Category,
  Product,
  ProductCategory,
  CartItem,
  Coupon,
  Order,
  OrderItem,
  Review,
  Wishlist,
  Blog,
  ShippingZone,
  CustomOrder,
  Setting,
};
