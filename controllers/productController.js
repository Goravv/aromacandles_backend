import { Op, QueryTypes, fn, col } from 'sequelize';
import slugify from 'slugify';
import { body, query } from 'express-validator';
import sequelize from '../config/db.js';
import { Product, Category, Review, User } from '../models/index.js';

export const listValidators = [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 48 }),
  query('sort').optional().isIn(['price_asc', 'price_desc', 'newest', 'name']),
  query('type').optional().isString(),
  query('q').optional().isString(),
  query('category').optional().isString(),
  query('scent').optional().isString(),
  query('occasion').optional().isString(),
  query('size').optional().isString(),
  query('collection').optional().isString(),
];

export async function listProducts(req, res) {
  const page = Number(req.query.page) || 1;
  const limit = Math.min(Number(req.query.limit) || 12, 48);
  const offset = (page - 1) * limit;
  const sort = req.query.sort || 'newest';
  const where = { is_active: true };
  if (req.query.type) {
    where.type = req.query.type;
  }
  if (req.query.q) {
    const q = `%${req.query.q.trim()}%`;
    where[Op.or] = [
      { name: { [Op.like]: q } },
      { description: { [Op.like]: q } },
    ];
  }

  let include = [
    { model: Category, as: 'primaryCategory', required: false },
    {
      model: Category,
      as: 'filterCategories',
      through: { attributes: [] },
      required: false,
    },
  ];

  const slugFilters = [];
  ['scent', 'occasion', 'size', 'collection'].forEach((key) => {
    if (req.query[key]) slugFilters.push(String(req.query[key]));
  });
  if (req.query.category) {
    slugFilters.push(String(req.query.category));
  }

  const uniqueSlugs = [...new Set(slugFilters)];

  if (uniqueSlugs.length) {
    const matched = await sequelize.query(
      `SELECT pc.product_id AS product_id
       FROM product_categories pc
       INNER JOIN categories c ON c.id = pc.category_id
       WHERE c.slug IN (:slugs)
       GROUP BY pc.product_id
       HAVING COUNT(DISTINCT c.slug) = :n`,
      {
        replacements: { slugs: uniqueSlugs, n: uniqueSlugs.length },
        type: QueryTypes.SELECT,
      }
    );
    const ids = matched.map((r) => r.product_id);
    if (!ids.length) {
      return res.json({
        products: [],
        total: 0,
        page,
        pages: 1,
      });
    }
    where.id = { [Op.in]: ids };
  }

  let order = [['created_at', 'DESC']];
  if (sort === 'price_asc') order = [['price', 'ASC']];
  if (sort === 'price_desc') order = [['price', 'DESC']];
  if (sort === 'name') order = [['name', 'ASC']];

  const { rows, count } = await Product.findAndCountAll({
    where,
    include,
    distinct: true,
    limit,
    offset,
    order,
  });

  res.json({
    products: rows.map((p) => formatProduct(p)),
    total: count,
    page,
    pages: Math.ceil(count / limit) || 1,
  });
}

export async function getBySlug(req, res) {
  const product = await Product.findOne({
    where: { slug: req.params.slug, is_active: true },
    include: [
      { model: Category, as: 'primaryCategory' },
      { model: Category, as: 'filterCategories', through: { attributes: [] } },
    ],
  });
  if (!product) {
    return res.status(404).json({ message: 'Product not found' });
  }
  const reviews = await Review.findAll({
    where: { product_id: product.id },
    include: [{ model: User, attributes: ['id', 'name'] }],
    order: [['created_at', 'DESC']],
    limit: 20,
  });
  const avgRow = await Review.findOne({
    where: { product_id: product.id },
    attributes: [[fn('AVG', col('rating')), 'avg']],
    raw: true,
  });
  res.json({
    product: formatProduct(product),
    reviews: reviews.map((r) => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      created_at: r.created_at,
      user: r.User ? { name: r.User.name } : null,
    })),
    ratingAvg:
      avgRow?.avg != null ? Number(Number(avgRow.avg).toFixed(2)) : null,
  });
}

export async function featured(req, res) {
  const rows = await Product.findAll({
    where: { is_active: true },
    include: [{ model: Category, as: 'primaryCategory', required: false }],
    limit: 8,
    order: sequelize.random(),
  });
  res.json({ products: rows.map(formatProduct) });
}

export async function related(req, res) {
  const product = await Product.findOne({ where: { slug: req.params.slug } });
  if (!product) return res.status(404).json({ message: 'Not found' });
  const siblings = await Product.findAll({
    where: {
      is_active: true,
      id: { [Op.ne]: product.id },
      [Op.or]: [{ category_id: product.category_id }, { type: product.type }],
    },
    limit: 4,
    order: sequelize.random(),
  });
  res.json({ products: siblings.map(formatProduct) });
}

function formatProduct(p) {
  const plain = p.get ? p.get({ plain: true }) : p;
  return {
    ...plain,
    price: Number(plain.price),
    weight_kg: plain.weight_kg != null ? Number(plain.weight_kg) : 0.2,
    images: Array.isArray(plain.images) ? plain.images : [],
  };
}

export const adminCreateValidators = [
  body('name').trim().isLength({ min: 2, max: 200 }),
  body('description').optional(),
  body('price').isFloat({ min: 0 }),
  body('stock').optional().isInt({ min: 0 }),
  body('weight_kg').optional().isFloat({ min: 0 }),
  body('type').isIn([
    'scented_jar',
    'pillar',
    'wax_melt',
    'soy',
    'tea_light',
    'wax_sachet',
  ]),
  body('category_id').optional().isInt(),
  body('category_slugs').optional().isArray(),
  body('is_customizable').optional().isBoolean(),
];

export async function adminCreate(req, res) {
  const {
    name,
    description,
    price,
    stock,
    weight_kg,
    type,
    category_id,
    category_slugs,
    is_customizable,
  } = req.body;
  let slug = slugify(name, { lower: true, strict: true });
  const exists = await Product.findOne({ where: { slug } });
  if (exists) slug = `${slug}-${Date.now()}`;
  const images = Array.isArray(req.body.image_paths) ? req.body.image_paths : [];
  const product = await Product.create({
    name,
    slug,
    description: description || '',
    price,
    stock: stock ?? 0,
    weight_kg: weight_kg ?? 0.2,
    type,
    category_id: category_id || null,
    images,
    is_customizable: Boolean(is_customizable),
    is_active: true,
  });
  if (Array.isArray(category_slugs) && category_slugs.length) {
    const cats = await Category.findAll({ where: { slug: category_slugs } });
    await product.setCategories(cats);
  }
  res.status(201).json({ product: formatProduct(product) });
}

export async function adminUpdate(req, res) {
  const product = await Product.findByPk(req.params.id);
  if (!product) return res.status(404).json({ message: 'Not found' });
  const allowed = [
    'name',
    'description',
    'price',
    'stock',
    'weight_kg',
    'type',
    'category_id',
    'is_customizable',
    'is_active',
    'images',
  ];
  const data = {};
  for (const k of allowed) {
    if (req.body[k] !== undefined) data[k] = req.body[k];
  }
  if (data.name) {
    data.slug = slugify(data.name, { lower: true, strict: true });
  }
  await product.update(data);
  if (Array.isArray(req.body.category_slugs)) {
    const cats = await Category.findAll({ where: { slug: req.body.category_slugs } });
    await product.setCategories(cats);
  }
  res.json({ product: formatProduct(product) });
}

export async function adminDelete(req, res) {
  const product = await Product.findByPk(req.params.id);
  if (!product) return res.status(404).json({ message: 'Not found' });
  await product.destroy();
  res.json({ message: 'Deleted' });
}

export async function adminList(req, res) {
  const page = Number(req.query.page) || 1;
  const limit = Math.min(Number(req.query.limit) || 24, 100);
  const offset = (page - 1) * limit;
  const { rows, count } = await Product.findAndCountAll({
    include: [{ model: Category, as: 'primaryCategory' }],
    limit,
    offset,
    order: [['created_at', 'DESC']],
  });
  res.json({
    products: rows.map(formatProduct),
    total: count,
    page,
  });
}
