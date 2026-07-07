import slugify from 'slugify';
import { Blog } from '../models/index.js';

export async function listPublished(req, res) {
  const page = Number(req.query.page) || 1;
  const limit = Math.min(Number(req.query.limit) || 9, 24);
  const offset = (page - 1) * limit;
  const { rows, count } = await Blog.findAndCountAll({
    where: { is_published: true },
    order: [['published_at', 'DESC']],
    limit,
    offset,
  });
  res.json({
    posts: rows,
    total: count,
    page,
    pages: Math.ceil(count / limit) || 1,
  });
}

export async function getBySlug(req, res) {
  const post = await Blog.findOne({
    where: { slug: req.params.slug, is_published: true },
  });
  if (!post) return res.status(404).json({ message: 'Not found' });
  res.json({ post });
}

export async function adminList(req, res) {
  const rows = await Blog.findAll({ order: [['created_at', 'DESC']] });
  res.json({ posts: rows });
}

export async function adminCreate(req, res) {
  const { title, content, author, is_published } = req.body;
  let slug = slugify(title, { lower: true, strict: true });
  const exists = await Blog.findOne({ where: { slug } });
  if (exists) slug = `${slug}-${Date.now()}`;
  const post = await Blog.create({
    title,
    slug,
    content,
    image: req.body.image || null,
    author: author || 'Aromacandle',
    is_published: Boolean(is_published),
    published_at: is_published ? new Date() : null,
  });
  res.status(201).json({ post });
}

export async function adminUpdate(req, res) {
  const post = await Blog.findByPk(req.params.id);
  if (!post) return res.status(404).json({ message: 'Not found' });
  const data = { ...req.body };
  if (data.title) data.slug = slugify(data.title, { lower: true, strict: true });
  if (data.is_published && !post.published_at) {
    data.published_at = new Date();
  }
  await post.update(data);
  res.json({ post });
}

export async function adminDelete(req, res) {
  const post = await Blog.findByPk(req.params.id);
  if (!post) return res.status(404).json({ message: 'Not found' });
  await post.destroy();
  res.json({ message: 'Deleted' });
}
