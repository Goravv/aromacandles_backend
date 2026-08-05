import { optimizeToWebp, optimizeBlogImage } from '../middleware/upload.js';
import { uploadToS3, uploadBlogToS3 } from '../services/s3.js';

export async function uploadProductImages(req, res) {
  if (!req.files?.length) {
    return res.status(400).json({ message: 'No files provided' });
  }

  try {
    const paths = [];
    for (const file of req.files) {
      const webpBuffer = await optimizeToWebp(file.buffer);
      const { url } = await uploadToS3(webpBuffer, `${Date.now()}.webp`, 'image/webp');
      paths.push(url);
    }
    res.json({ paths });
  } catch (error) {
    console.error('Product image upload error:', error);
    res.status(500).json({ message: 'Failed to upload images to S3' });
  }
}

export async function uploadBlogImage(req, res) {
  if (!req.file) {
    return res.status(400).json({ message: 'No file provided' });
  }

  try {
    const webpBuffer = await optimizeBlogImage(req.file.buffer);
    const { url } = await uploadBlogToS3(webpBuffer, `${Date.now()}.webp`, 'image/webp');
    res.json({ path: url });
  } catch (error) {
    console.error('Blog image upload error:', error);
    res.status(500).json({ message: 'Failed to upload image to S3' });
  }
}
