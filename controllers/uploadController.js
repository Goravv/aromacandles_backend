import crypto from 'crypto';
import { optimizeToWebp, optimizeBlogImage } from '../middleware/upload.js';

export async function uploadProductImages(req, res) {
  if (!req.files?.length) {
    return res.status(400).json({ message: 'No files' });
  }
  const paths = [];
  for (const file of req.files) {
    const name = crypto.randomBytes(8).toString('hex');
    const url = await optimizeToWebp(file.path, name);
    paths.push(url);
  }
  res.json({ paths });
}

export async function uploadBlogImage(req, res) {
  if (!req.file) {
    return res.status(400).json({ message: 'No file' });
  }
  const name = crypto.randomBytes(8).toString('hex');
  const url = await optimizeBlogImage(req.file.path, name);
  res.json({ path: url });
}
