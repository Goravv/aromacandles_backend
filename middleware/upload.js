import multer from 'multer';
import sharp from 'sharp';

const storage = multer.memoryStorage();

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

export async function optimizeToWebp(fileBuffer) {
  return await sharp(fileBuffer)
    .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer();
}

export async function optimizeBlogImage(fileBuffer) {
  return await sharp(fileBuffer)
    .resize(1400, 800, { fit: 'cover' })
    .webp({ quality: 82 })
    .toBuffer();
}
