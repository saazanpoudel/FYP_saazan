const express = require('express');
const { protect } = require('../middleware/auth');
const { uploadProfile, uploadVerification, uploadPackage, uploadRefund } = require('../config/cloudinary');

const router = express.Router();

// @route   POST /api/uploads/avatar
// @desc    Upload user profile picture to Cloudinary
// @access  Private
router.post('/avatar', protect, uploadProfile.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No image provided' });
  }

  res.json({
    success: true,
    url: req.file.path, // Cloudinary URL
    public_id: req.file.filename,
  });
});

// @route   POST /api/uploads/government-id
// @desc    Upload guide ID document to Cloudinary
// @access  Private (Guide only)
router.post('/government-id', protect, uploadVerification.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No document image provided' });
  }

  res.json({
    success: true,
    url: req.file.path, // Cloudinary URL
    public_id: req.file.filename,
  });
});

// @route   POST /api/uploads/packages
// @desc    Upload multiple package images to Cloudinary
// @access  Private (Guide or Admin)
router.post('/packages', protect, uploadPackage.array('images', 5), (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ success: false, message: 'No images provided' });
  }

  const urls = req.files.map(file => file.path);
  res.json({
    success: true,
    urls, // Array of Cloudinary URLs
  });
});

// @route   POST /api/uploads/refund-proof
// @desc    Upload refund payout proof to Cloudinary
// @access  Private (Admin only)
router.post('/refund-proof', protect, uploadRefund.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No proof image provided' });
  }

  res.json({
    success: true,
    url: req.file.path,
    public_id: req.file.filename,
  });
});

module.exports = router;
