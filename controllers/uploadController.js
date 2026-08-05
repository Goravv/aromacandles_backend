import { optimizeToWebp, optimizeBlogImage } from '../middleware/upload.js';
import { uploadToS3, uploadBlogToS3 } from '../services/s3.js';

export async function uploadProductImages(req, res) {
  if (!req.files?.length) {
    return res.status(400).json({ message: 'No files' });
  }

  const paths = [];
  for (const file of req.files) {
    const webpBuffer = await optimizeToWebp(file.buffer);
    const { url } = await uploadToS3(webpBuffer, `${Date.now()}.webp`, 'image/webp');
    paths.push(url);
  }
  res.json({ paths });
}

export async function uploadBlogImage(req, res) {
  if (!req.file) {
    return res.status(400).json({ message: 'No file' });
  }

  const webpBuffer = await optimizeBlogImage(req.file.buffer);
  const { url } = await uploadBlogToS3(webpBuffer, `${Date.now()}.webp`, 'image/webp');
  res.json({ path: url });
}
