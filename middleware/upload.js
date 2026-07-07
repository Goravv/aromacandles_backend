import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const tempDir = path.join(root, 'uploads', 'temp');
const productDir = path.join(root, 'uploads', 'products');
const blogDir = path.join(root, 'uploads', 'blog');

[productDir, blogDir, tempDir].forEach((d) => {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
});

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, tempDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  },
});

export const uploadProductImages = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 8 },
  fileFilter: (_req, file, cb) => {
    if (!/^image\/(jpeg|png|webp|gif)$/i.test(file.mimetype)) {
      return cb(new Error('Only image files allowed'));
    }
    cb(null, true);
  },
});

export const uploadBlogImage = multer({
  storage,
  limits: { fileSize: 4 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!/^image\/(jpeg|png|webp)$/i.test(file.mimetype)) {
      return cb(new Error('Only image files allowed'));
    }
    cb(null, true);
  },
});

export async function optimizeToWebp(filePath, outName) {
  const out = path.join(productDir, `${outName}.webp`);
  await sharp(filePath)
    .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 82 })
    .toFile(out);
  try {
    fs.unlinkSync(filePath);
  } catch {
    /* ignore */
  }
  return `/uploads/products/${outName}.webp`;
}

export async function optimizeBlogImage(filePath, outName) {
  const out = path.join(blogDir, `${outName}.webp`);
  await sharp(filePath)
    .resize(1400, 800, { fit: 'cover' })
    .webp({ quality: 82 })
    .toFile(out);
  try {
    fs.unlinkSync(filePath);
  } catch {
    /* ignore */
  }
  return `/uploads/blog/${outName}.webp`;
}
