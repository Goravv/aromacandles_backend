'use strict';

/** @param {import('sequelize').QueryInterface} queryInterface */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('users', {
      id: { type: Sequelize.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      name: { type: Sequelize.STRING(120), allowNull: false },
      email: { type: Sequelize.STRING(191), allowNull: false, unique: true },
      password: { type: Sequelize.STRING(255), allowNull: false },
      role: { type: Sequelize.ENUM('user', 'admin'), defaultValue: 'user' },
      phone: { type: Sequelize.STRING(20), allowNull: true },
      email_verified: { type: Sequelize.BOOLEAN, defaultValue: false },
      otp_hash: { type: Sequelize.STRING(255), allowNull: true },
      otp_expires_at: { type: Sequelize.DATE, allowNull: true },
      refresh_token_hash: { type: Sequelize.STRING(255), allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
    });

    await queryInterface.createTable('addresses', {
      id: { type: Sequelize.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      user_id: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
      name: { type: Sequelize.STRING(120), allowNull: false },
      street: { type: Sequelize.STRING(255), allowNull: false },
      city: { type: Sequelize.STRING(100), allowNull: false },
      state: { type: Sequelize.STRING(100), allowNull: false },
      pincode: { type: Sequelize.STRING(10), allowNull: false },
      phone: { type: Sequelize.STRING(20), allowNull: false },
      is_default: { type: Sequelize.BOOLEAN, defaultValue: false },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
    });

    await queryInterface.createTable('categories', {
      id: { type: Sequelize.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      name: { type: Sequelize.STRING(120), allowNull: false },
      slug: { type: Sequelize.STRING(160), allowNull: false, unique: true },
      type: { type: Sequelize.ENUM('scent', 'occasion', 'size', 'collection'), allowNull: false },
      parent_id: { type: Sequelize.INTEGER.UNSIGNED, allowNull: true, references: { model: 'categories', key: 'id' }, onDelete: 'SET NULL' },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
    });

    await queryInterface.createTable('products', {
      id: { type: Sequelize.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      name: { type: Sequelize.STRING(200), allowNull: false },
      slug: { type: Sequelize.STRING(220), allowNull: false, unique: true },
      description: { type: Sequelize.TEXT, allowNull: true },
      price: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
      stock: { type: Sequelize.INTEGER.UNSIGNED, defaultValue: 0 },
      weight_kg: { type: Sequelize.DECIMAL(8, 3), defaultValue: 0.2 },
      category_id: { type: Sequelize.INTEGER.UNSIGNED, allowNull: true, references: { model: 'categories', key: 'id' }, onDelete: 'SET NULL' },
      type: {
        type: Sequelize.ENUM(
          'scented_jar',
          'pillar',
          'wax_melt',
          'soy',
          'tea_light',
          'wax_sachet'
        ),
        allowNull: false,
      },
      images: { type: Sequelize.JSON, allowNull: true },
      is_customizable: { type: Sequelize.BOOLEAN, defaultValue: false },
      is_active: { type: Sequelize.BOOLEAN, defaultValue: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
    });

    await queryInterface.createTable('product_categories', {
      product_id: { type: Sequelize.INTEGER.UNSIGNED, primaryKey: true, references: { model: 'products', key: 'id' }, onDelete: 'CASCADE' },
      category_id: { type: Sequelize.INTEGER.UNSIGNED, primaryKey: true, references: { model: 'categories', key: 'id' }, onDelete: 'CASCADE' },
    });

    await queryInterface.createTable('cart_items', {
      id: { type: Sequelize.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      user_id: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
      product_id: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, references: { model: 'products', key: 'id' }, onDelete: 'CASCADE' },
      quantity: { type: Sequelize.INTEGER.UNSIGNED, defaultValue: 1 },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
    });
    await queryInterface.addIndex('cart_items', ['user_id', 'product_id'], { unique: true, name: 'uniq_cart_user_product' });

    await queryInterface.createTable('coupons', {
      id: { type: Sequelize.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      code: { type: Sequelize.STRING(40), allowNull: false, unique: true },
      discount_type: { type: Sequelize.ENUM('percent', 'fixed'), allowNull: false },
      discount_value: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
      min_order: { type: Sequelize.DECIMAL(10, 2), defaultValue: 0 },
      expiry: { type: Sequelize.DATE, allowNull: true },
      usage_limit: { type: Sequelize.INTEGER.UNSIGNED, allowNull: true },
      used_count: { type: Sequelize.INTEGER.UNSIGNED, defaultValue: 0 },
      is_active: { type: Sequelize.BOOLEAN, defaultValue: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
    });

    await queryInterface.createTable('orders', {
      id: { type: Sequelize.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      user_id: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
      address_id: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, references: { model: 'addresses', key: 'id' }, onDelete: 'RESTRICT' },
      coupon_id: { type: Sequelize.INTEGER.UNSIGNED, allowNull: true, references: { model: 'coupons', key: 'id' }, onDelete: 'SET NULL' },
      subtotal: { type: Sequelize.DECIMAL(12, 2), allowNull: false },
      discount: { type: Sequelize.DECIMAL(12, 2), defaultValue: 0 },
      shipping_cost: { type: Sequelize.DECIMAL(10, 2), defaultValue: 0 },
      gst: { type: Sequelize.DECIMAL(12, 2), defaultValue: 0 },
      total: { type: Sequelize.DECIMAL(12, 2), allowNull: false },
      shipping_weight_kg: { type: Sequelize.DECIMAL(10, 3), defaultValue: 0 },
      status: {
        type: Sequelize.ENUM('pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'failed'),
        defaultValue: 'pending',
      },
      payment_status: { type: Sequelize.ENUM('pending', 'paid', 'failed', 'refunded'), defaultValue: 'pending' },
      razorpay_order_id: { type: Sequelize.STRING(120), allowNull: true },
      razorpay_payment_id: { type: Sequelize.STRING(120), allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
    });

    await queryInterface.createTable('order_items', {
      id: { type: Sequelize.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      order_id: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, references: { model: 'orders', key: 'id' }, onDelete: 'CASCADE' },
      product_id: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, references: { model: 'products', key: 'id' }, onDelete: 'RESTRICT' },
      quantity: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false },
      price: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
      customization_note: { type: Sequelize.TEXT, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
    });

    await queryInterface.createTable('reviews', {
      id: { type: Sequelize.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      product_id: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, references: { model: 'products', key: 'id' }, onDelete: 'CASCADE' },
      user_id: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
      rating: { type: Sequelize.TINYINT.UNSIGNED, allowNull: false },
      comment: { type: Sequelize.TEXT, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
    });
    await queryInterface.addIndex('reviews', ['product_id', 'user_id'], { unique: true, name: 'uniq_review_product_user' });

    await queryInterface.createTable('wishlists', {
      id: { type: Sequelize.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      user_id: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
      product_id: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, references: { model: 'products', key: 'id' }, onDelete: 'CASCADE' },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
    });
    await queryInterface.addIndex('wishlists', ['user_id', 'product_id'], { unique: true, name: 'uniq_wishlist_user_product' });

    await queryInterface.createTable('blogs', {
      id: { type: Sequelize.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      title: { type: Sequelize.STRING(220), allowNull: false },
      slug: { type: Sequelize.STRING(240), allowNull: false, unique: true },
      content: { type: Sequelize.TEXT('long'), allowNull: false },
      image: { type: Sequelize.STRING(500), allowNull: true },
      author: { type: Sequelize.STRING(120), allowNull: true },
      is_published: { type: Sequelize.BOOLEAN, defaultValue: false },
      published_at: { type: Sequelize.DATE, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
    });

    await queryInterface.createTable('shipping_zones', {
      id: { type: Sequelize.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      zone_name: { type: Sequelize.STRING(120), allowNull: false },
      pincodes: { type: Sequelize.TEXT, allowNull: false },
      base_rate: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
      per_kg_rate: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
    });

    await queryInterface.createTable('custom_orders', {
      id: { type: Sequelize.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      user_id: { type: Sequelize.INTEGER.UNSIGNED, allowNull: true, references: { model: 'users', key: 'id' }, onDelete: 'SET NULL' },
      name: { type: Sequelize.STRING(120), allowNull: false },
      product_type: { type: Sequelize.STRING(80), allowNull: false },
      scent: { type: Sequelize.STRING(120), allowNull: true },
      size: { type: Sequelize.STRING(40), allowNull: true },
      message: { type: Sequelize.TEXT, allowNull: true },
      delivery_date: { type: Sequelize.DATEONLY, allowNull: true },
      status: { type: Sequelize.ENUM('new', 'quoted', 'in_progress', 'completed', 'cancelled'), defaultValue: 'new' },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
    });

    await queryInterface.createTable('settings', {
      id: { type: Sequelize.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      key: { type: Sequelize.STRING(80), allowNull: false, unique: true },
      value: { type: Sequelize.TEXT, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('settings');
    await queryInterface.dropTable('custom_orders');
    await queryInterface.dropTable('shipping_zones');
    await queryInterface.dropTable('blogs');
    await queryInterface.dropTable('wishlists');
    await queryInterface.dropTable('reviews');
    await queryInterface.dropTable('order_items');
    await queryInterface.dropTable('orders');
    await queryInterface.dropTable('coupons');
    await queryInterface.dropTable('cart_items');
    await queryInterface.dropTable('product_categories');
    await queryInterface.dropTable('products');
    await queryInterface.dropTable('categories');
    await queryInterface.dropTable('addresses');
    await queryInterface.dropTable('users');
  },
};
