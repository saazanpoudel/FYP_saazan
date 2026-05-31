const express = require('express');
const { body, validationResult } = require('express-validator');
const Package = require('../models/Package');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');
const { createNotification } = require('../utils/notify');

const router = express.Router();

// @route   GET /api/packages
// @desc    Get all active packages with filters
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { guide, destination, category, difficulty, minPrice, maxPrice, page = 1, limit = 10 } = req.query;

    const query = { isActive: true, status: 'approved' };

    if (guide) {
      query.guide = guide;
    }
    if (destination) {
      query.destination = { $regex: destination, $options: 'i' };
    }
    if (category) {
      query.category = category;
    }
    if (difficulty) {
      query.difficulty = difficulty;
    }
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const packages = await Package.find(query)
      .populate('guide', 'name email avatar guideProfile')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Package.countDocuments(query);

    res.json({
      success: true,
      count: packages.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      packages,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

// @route   GET /api/packages/mine
// @desc    Get all packages belonging to the logged-in guide (all statuses)
// @access  Private (Guide only)
router.get('/mine', protect, authorize('guide'), async (req, res) => {
  try {
    const packages = await Package.find({ guide: req.user._id, isActive: true })
      .populate('reviewedBy', 'name')
      .sort({ createdAt: -1 });

    res.json({ success: true, packages });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// @route   GET /api/packages/:id
// @desc    Get single package
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const package = await Package.findById(req.params.id).populate(
      'guide',
      'name email phone avatar guideProfile'
    );

    if (!package || !package.isActive || package.status !== 'approved') {
      return res.status(404).json({
        success: false,
        message: 'Package not found',
      });
    }

    res.json({
      success: true,
      package,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

// @route   POST /api/packages
// @desc    Create a new package
// @access  Private (Guide only)
router.post(
  '/',
  protect,
  authorize('guide', 'admin'),
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('description').notEmpty().withMessage('Description is required'),
    body('destination').notEmpty().withMessage('Destination is required'),
    body('duration').isInt({ min: 1 }).withMessage('Duration must be at least 1 day'),
    body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    // Check if guide is verified (only for guides, admins skip this)
    if (req.user.role === 'guide' && !req.user.guideProfile?.governmentIdVerified) {
      return res.status(403).json({
        success: false,
        message: 'Your profile must be verified by an admin before you can create packages.',
      });
    }

    try {
      const packageData = {
        ...req.body,
        guide: req.body.guide || req.user._id,
        // Admins bypass approval — their packages go live immediately
        ...(req.user.role === 'admin' && {
          status: 'approved',
          reviewedBy: req.user._id,
          reviewedAt: new Date(),
        }),
      };

      const newPackage = await Package.create(packageData);

      const populatedPackage = await Package.findById(newPackage._id).populate(
        'guide',
        'name email avatar'
      );

      // Notify all admins when a guide submits a package for review
      if (req.user.role === 'guide') {
        const admins = await User.find({ role: 'admin' });
        for (const admin of admins) {
          await createNotification(req.app, {
            recipient: admin._id,
            sender: req.user._id,
            type: 'system',
            title: 'New Package Awaiting Approval',
            message: `${req.user.name} has submitted a new package "${newPackage.title}" for review and approval.`,
            extraData: { packageId: newPackage._id }
          });
        }
      }

      res.status(201).json({
        success: true,
        package: populatedPackage,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Server error',
        error: error.message,
      });
    }
  }
);

// @route   PUT /api/packages/:id
// @desc    Update package
// @access  Private (Guide only - owner)
router.put('/:id', protect, authorize('guide', 'admin'), async (req, res) => {
  try {
    const package = await Package.findById(req.params.id);

    if (!package) {
      return res.status(404).json({
        success: false,
        message: 'Package not found',
      });
    }

    // Check if user owns this package OR is admin
    if (req.user.role !== 'admin' && package.guide.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to update this package',
      });
    }

    Object.keys(req.body).forEach((key) => {
      if (key !== 'guide' && key !== '_id') {
        package[key] = req.body[key];
      }
    });

    package.updatedAt = new Date();
    await package.save();

    const updatedPackage = await Package.findById(package._id).populate(
      'guide',
      'name email avatar'
    );

    res.json({
      success: true,
      package: updatedPackage,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

// @route   DELETE /api/packages/:id
// @desc    Delete package (soft delete)
// @access  Private (Guide only - owner)
router.delete('/:id', protect, authorize('guide', 'admin'), async (req, res) => {
  try {
    const package = await Package.findById(req.params.id);

    if (!package) {
      return res.status(404).json({
        success: false,
        message: 'Package not found',
      });
    }

    // Check if user owns this package OR is admin
    if (req.user.role !== 'admin' && package.guide.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to delete this package',
      });
    }

    package.isActive = false;
    await package.save();

    res.json({
      success: true,
      message: 'Package deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

module.exports = router;

