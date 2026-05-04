const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const dotenv = require('dotenv');

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    // Determine folder based on file type or route
    let folder = 'lms/others';
    if (file.mimetype.startsWith('video')) {
      folder = 'lms/videos';
    } else if (file.mimetype.startsWith('image')) {
      folder = 'lms/images';
    } else if (file.mimetype === 'application/pdf') {
      folder = 'lms/documents';
    }

    return {
      folder: folder,
      resource_type: 'auto', // Important for non-image files
      public_id: `${Date.now()}-${file.originalname.split('.')[0]}`,
    };
  },
});

module.exports = { cloudinary, storage };
