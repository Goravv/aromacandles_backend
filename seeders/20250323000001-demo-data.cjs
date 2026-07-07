'use strict';

const bcrypt = require('bcryptjs');

module.exports = {
  async up(queryInterface) {
    const now = new Date();
    const pwd = await bcrypt.hash('Admin@12345', 12);

    await queryInterface.bulkInsert('users', [
      {
        id: 1,
        name: 'Store Admin',
        email: 'admin@aromacandle.local',
        password: pwd,
        role: 'admin',
        phone: '9999999999',
        email_verified: true,
        otp_hash: null,
        otp_expires_at: null,
        refresh_token_hash: null,
        created_at: now,
        updated_at: now,
      },
    ]);

    await queryInterface.bulkInsert('settings', [
      {
        id: 1,
        key: 'gst_rate_percent',
        value: '18',
        created_at: now,
        updated_at: now,
      },
    ]);

    const cats = [
      ['Lavender', 'lavender', 'scent'],
      ['Vanilla', 'vanilla', 'scent'],
      ['Rose', 'rose', 'scent'],
      ['Sandalwood', 'sandalwood', 'scent'],
      ['Wedding', 'wedding', 'occasion'],
      ['Birthday', 'birthday', 'occasion'],
      ['Meditation', 'meditation', 'occasion'],
      ['Festive', 'festive', 'occasion'],
      ['Self-care', 'self-care', 'occasion'],
      ['Small', 'small', 'size'],
      ['Medium', 'medium', 'size'],
      ['Large', 'large', 'size'],
      ['Luxury', 'luxury', 'collection'],
      ['Everyday', 'everyday', 'collection'],
      ['Gift Sets', 'gift-sets', 'collection'],
      ['Seasonal', 'seasonal', 'collection'],
    ];

    let cid = 1;
    const catRows = cats.map(([name, slug, type]) => ({
      id: cid++,
      name,
      slug,
      type,
      parent_id: null,
      created_at: now,
      updated_at: now,
    }));

    await queryInterface.bulkInsert('categories', catRows);

    const productTypes = [
      'scented_jar',
      'pillar',
      'wax_melt',
      'soy',
      'tea_light',
      'wax_sachet',
    ];
    const images = JSON.stringify(['/images/placeholder-candle.svg']);

    const names = [
      ['Midnight Lavender Jar', 'midnight-lavender-jar'],
      ['Vanilla Bean Comfort', 'vanilla-bean-comfort'],
      ['Rose Garden Pillar', 'rose-garden-pillar'],
      ['Sandalwood Calm Soy', 'sandalwood-calm-soy'],
      ['Festive Spice Melts', 'festive-spice-melts'],
      ['Tea Light Set (12)', 'tea-light-set-12'],
      ['Luxury Gift Trio', 'luxury-gift-trio'],
      ['Everyday Citrus Jar', 'everyday-citrus-jar'],
    ];

    const products = [];
    let pid = 1;
    for (const [name, slug] of names) {
      const type = productTypes[pid % productTypes.length];
      const price = 150 + pid * 75;
      products.push({
        id: pid,
        name,
        slug,
        description: `Hand-poured in Jind, Haryana. Premium wax blend with a clean burn.`,
        price,
        stock: Math.max(3, 25 - pid),
        weight_kg: 0.25 + pid * 0.05,
        category_id: ((pid - 1) % 4) + 1,
        type,
        images,
        is_customizable: pid % 3 === 0,
        is_active: true,
        created_at: now,
        updated_at: now,
      });
      pid++;
    }

    await queryInterface.bulkInsert('products', products);

    const pc = [];
    for (let i = 1; i <= products.length; i++) {
      const scentId = ((i - 1) % 4) + 1;
      const occId = 5 + ((i - 1) % 4);
      const sizeId = 9 + ((i - 1) % 3);
      const colId = 13 + ((i - 1) % 4);
      pc.push({ product_id: i, category_id: scentId });
      pc.push({ product_id: i, category_id: occId });
      pc.push({ product_id: i, category_id: sizeId });
      pc.push({ product_id: i, category_id: colId });
    }
    await queryInterface.bulkInsert('product_categories', pc);

    await queryInterface.bulkInsert('shipping_zones', [
      {
        id: 1,
        zone_name: 'Haryana & NCR',
        pincodes: JSON.stringify(['126102', '110001', '122001', '121001']),
        base_rate: 49,
        per_kg_rate: 25,
        created_at: now,
        updated_at: now,
      },
      {
        id: 2,
        zone_name: 'Rest of India',
        pincodes: JSON.stringify(['400001', '560001', '600001']),
        base_rate: 79,
        per_kg_rate: 35,
        created_at: now,
        updated_at: now,
      },
    ]);

    await queryInterface.bulkInsert('coupons', [
      {
        id: 1,
        code: 'WELCOME10',
        discount_type: 'percent',
        discount_value: 10,
        min_order: 500,
        expiry: null,
        usage_limit: 1000,
        used_count: 0,
        is_active: true,
        created_at: now,
        updated_at: now,
      },
    ]);

    await queryInterface.bulkInsert('blogs', [
      {
        id: 1,
        title: 'Candle care: first burn matters',
        slug: 'candle-care-first-burn',
        content:
          '<p>Trim the wick to 5mm before each burn. Let the wax melt to the edges on the first use to prevent tunneling.</p>',
        image: '/images/placeholder-candle.svg',
        author: 'Aromacandle',
        is_published: true,
        published_at: now,
        created_at: now,
        updated_at: now,
      },
      {
        id: 2,
        title: 'Scent pairing for cozy evenings',
        slug: 'scent-pairing-cozy-evenings',
        content:
          '<p>Layer lavender with vanilla for a soft, calming glow. Try sandalwood with citrus for depth.</p>',
        image: '/images/placeholder-candle.svg',
        author: 'Aromacandle',
        is_published: true,
        published_at: now,
        created_at: now,
        updated_at: now,
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('blogs', null, {});
    await queryInterface.bulkDelete('coupons', null, {});
    await queryInterface.bulkDelete('shipping_zones', null, {});
    await queryInterface.bulkDelete('product_categories', null, {});
    await queryInterface.bulkDelete('products', null, {});
    await queryInterface.bulkDelete('categories', null, {});
    await queryInterface.bulkDelete('settings', null, {});
    await queryInterface.bulkDelete('users', null, {});
  },
};
