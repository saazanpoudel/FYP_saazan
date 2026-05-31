const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Setup Storage for Profile Pictures
const profileStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'sgms/profiles',
    allowed_formats: ['jpg', 'png', 'jpeg'],
    transformation: [
      { width: 400, height: 400, crop: 'thumb', gravity: 'face' }, // Face-detected avatar crop
      { format: 'webp' }, // Standardize to WebP for modern speed
      { quality: 'auto' }, // Automatic quality optimization
      { fetch_format: 'auto' } // Auto format selection based on browser support
    ],
  },
});

// Setup Storage for Verification Documents (IDs)
const verificationStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'sgms/verifications',
    allowed_formats: ['jpg', 'png', 'jpeg', 'pdf'],
  },
});

// Setup Storage for Trekking Packages
const packageStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'sgms/packages',
    allowed_formats: ['jpg', 'png', 'jpeg'],
    transformation: [
      { width: 1200, crop: 'limit' }, // Limit high-res image widths
      { format: 'webp' },
      { quality: 'auto' }
    ],
  },
});

// Setup Storage for Refund Settlements
const refundStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'sgms/refunds',
    allowed_formats: ['jpg', 'png', 'jpeg'],
    transformation: [
      { width: 1200, crop: 'limit' },
      { quality: 'auto' }
    ],
  },
});

const uploadProfile = multer({ storage: profileStorage });
const uploadVerification = multer({ storage: verificationStorage });
const uploadPackage = multer({ storage: packageStorage });
const uploadRefund = multer({ storage: refundStorage });

module.exports = {
  cloudinary,
  uploadProfile,
  uploadVerification,
  uploadPackage,
  uploadRefund,
};
