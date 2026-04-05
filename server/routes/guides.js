const express = require('express');
const mongoose = require('mongoose');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Package = require('../models/Package');
const Booking = require('../models/Booking');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/guides/recommended
// @desc    Get top recommended guides
// @access  Public
router.get('/recommended', async (req, res) => {
  try {
    const guides = await User.find({
      role: 'guide',
      isActive: true,
      'guideProfile.governmentIdVerified': true,
    })
      .select('name avatar guideProfile points badges')
      .sort({ 'guideProfile.rating': -1, points: -1 })
      .limit(6);

    res.json({
      success: true,
      guides,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

// @route   GET /api/guides
// @desc    Get all verified guides with filters
// @access  Public
router.get('/', async (req, res) => {
  try {
    const {
      specialization,
      minRating,
      language,
      destination,
      availableDate,
      page = 1,
      limit = 10,
    } = req.query;

    const query = {
      role: 'guide',
      isActive: true,
      'guideProfile.governmentIdVerified': true,
    };

    if (specialization) {
      // Split the specialization into words and create a regex that matches any of them
      const words = specialization.split(' ').filter(word => word.length > 3);
      if (words.length > 0) {
        const regexPattern = words.join('|');
        query['guideProfile.specialization'] = { $elemMatch: { $regex: regexPattern, $options: 'i' } };
      } else {
        query['guideProfile.specialization'] = { $elemMatch: { $regex: specialization, $options: 'i' } };
      }
    }

    if (minRating) {
      query['guideProfile.rating'] = { $gte: parseFloat(minRating) };
    }

    if (language) {
      query['guideProfile.languages'] = { $in: [language] };
    }

    if (availableDate) {
      // Check if the specific date is marked as true in the availability map
      query[`guideProfile.availability.${availableDate}`] = true;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const guides = await User.find(query)
      .select('name email phone avatar guideProfile points badges')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ 'guideProfile.rating': -1 });

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      count: guides.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      guides,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

// @route   GET /api/guides/:id
// @desc    Get single guide profile
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const guide = await User.findById(req.params.id).select(
      '-password -__v'
    );

    if (!guide || guide.role !== 'guide') {
      return res.status(404).json({
        success: false,
        message: 'Guide not found',
      });
    }

    // Get guide's packages
    const packages = await Package.find({
      guide: guide._id,
      isActive: true,
    });

    // Get guide's bookings count
    const bookingsCount = await Booking.countDocuments({
      guide: guide._id,
      status: 'completed',
    });

    res.json({
      success: true,
      guide: {
        ...guide.toObject(),
        packages,
        bookingsCount,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

// @route   GET /api/guides/dashboard
// @desc    Get guide dashboard statistics
// @access  Private (Guide only)
router.get('/dashboard', protect, authorize('guide'), async (req, res) => {
  try {
    const guideId = new mongoose.Types.ObjectId(req.user._id);

    const pendingRequests = await Booking.countDocuments({
      guide: guideId,
      status: 'pending'
    });

    const upcomingTrips = await Booking.find({
      guide: guideId,
      status: { $in: ['confirmed', 'pending'] },
      startDate: { $gte: new Date() },
    }).populate('tourist', 'name');

    const totalTrekkers = await Booking.aggregate([
      { $match: { guide: guideId, status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$numberOfPeople' } } },
    ]);

    const earnings = await Booking.aggregate([
      { 
        $match: { 
          guide: guideId, 
          status: { $in: ['confirmed', 'completed'] },
          paymentStatus: 'paid'
        } 
      },
      { 
        $group: { 
          _id: null, 
          gross: { $sum: '$totalAmount' },
          net: { $sum: { $subtract: ["$totalAmount", { $ifNull: ["$commission", { $multiply: ["$totalAmount", 0.1] }] }] } } 
        } 
      },
    ]);

    const potentialEarnings = await Booking.aggregate([
      { 
        $match: { 
          guide: guideId, 
          status: 'confirmed',
          paymentStatus: 'pending'
        } 
      },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);

    const transactionHistory = await Booking.find({
      guide: guideId,
      status: { $in: ['confirmed', 'completed'] },
      paymentStatus: 'paid'
    })
    .sort({ createdAt: -1 })
    .limit(10)
    .populate('tourist', 'name email avatar')
    .populate('package', 'name');

    const monthlyEarnings = await Booking.aggregate([
      {
        $match: {
          guide: guideId,
          status: { $in: ['confirmed', 'completed'] },
          paymentStatus: 'paid',
          createdAt: { $gte: new Date(new Date().setMonth(new Date().getMonth() - 6)) },
        },
      },
      {
        $group: {
          _id: {
            month: { $month: '$createdAt' },
            year: { $year: '$createdAt' },
          },
          total: { $sum: { $subtract: ["$totalAmount", { $ifNull: ["$commission", { $multiply: ["$totalAmount", 0.1] }] }] } },
          gross: { $sum: "$totalAmount" }
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    res.json({
      success: true,
      stats: {
        grossEarnings: earnings[0]?.gross || 0,
        netEarnings: earnings[0]?.net || 0,
        walletBalance: req.user.guideProfile?.earnings || 0,
        totalCommission: (earnings[0]?.gross || 0) - (earnings[0]?.net || 0),
        potentialEarnings: potentialEarnings[0]?.total || 0,
        upcomingTrips: upcomingTrips.filter(b => b.status === 'confirmed').length,
        pendingRequests,
        totalTrekkers: totalTrekkers[0]?.total || 0,
        rating: req.user.guideProfile?.rating || 0,
      },
      upcomingTrips,
      monthlyEarnings,
      transactionHistory,
    });
  } catch (error) {
    console.error('DASHBOARD_ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Server failure during stats aggregation',
      error: error.message,
    });
  }
});

// @route   GET /api/guides/:id/blocked-dates
// @desc    Get guide's blocked dates (bookings + manual)
// @access  Public
router.get('/:id/blocked-dates', async (req, res) => {
  try {
    const guide = await User.findById(req.params.id);
    if (!guide) return res.status(404).json({ success: false, message: 'Guide not found' });

    const bookings = await Booking.find({
      guide: guide._id,
      status: { $in: ['confirmed', 'completed', 'pending'] },
      endDate: { $gte: new Date() }
    }).select('startDate endDate');

    const blockedDates = [];
    bookings.forEach(b => {
       let curr = new Date(b.startDate);
       const end = new Date(b.endDate);
       while(curr <= end) {
         blockedDates.push(new Date(curr).toISOString().split('T')[0]);
         curr.setDate(curr.getDate() + 1);
       }
    });

    res.json({
      success: true,
      blockedDates,
      availabilityRanges: guide.guideProfile.availabilityRanges || [],
      recurringDays: guide.guideProfile.recurringDays || [],
      unavailabilityExceptions: (guide.guideProfile.unavailabilityExceptions || []).map(d => new Date(d).toISOString().split('T')[0])
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   PUT /api/guides/availability
// @desc    Update guide availability calendar
// @access  Private (Guide only)
router.put('/availability', protect, authorize('guide'), async (req, res) => {
  try {
    const { availability, recurringDays, availabilityRanges, unavailabilityExceptions } = req.body; 
    const guide = await User.findById(req.user._id);

    if (availability) {
      if (!guide.guideProfile.availability) {
        guide.guideProfile.availability = new Map();
      }
      Object.keys(availability).forEach((date) => {
        guide.guideProfile.availability.set(date, availability[date]);
      });
    }

    if (recurringDays !== undefined) guide.guideProfile.recurringDays = recurringDays;
    if (availabilityRanges !== undefined) guide.guideProfile.availabilityRanges = availabilityRanges;
    if (unavailabilityExceptions !== undefined) guide.guideProfile.unavailabilityExceptions = unavailabilityExceptions;

    await guide.save();

    res.json({
      success: true,
      availability: guide.guideProfile.availability,
      recurringDays: guide.guideProfile.recurringDays,
      availabilityRanges: guide.guideProfile.availabilityRanges,
      unavailabilityExceptions: guide.guideProfile.unavailabilityExceptions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

// @route   PUT /api/guides/profile
// @desc    Update guide profile
// @access  Private (Guide only)
router.put(
  '/profile',
  protect,
  authorize('guide'),
  [
    body('specialization').optional().isArray(),
    body('languages').optional().isArray(),
    body('bio').optional().isString(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    try {
      const {
        specialization,
        languages,
        bio,
        experience,
        governmentId,
      } = req.body;

      const guide = await User.findById(req.user._id);

      if (specialization) {
        guide.guideProfile.specialization = specialization;
      }
      if (languages) {
        guide.guideProfile.languages = languages;
      }
      if (bio) {
        guide.guideProfile.bio = bio;
      }
      if (experience) {
        guide.guideProfile.experience = experience;
      }
      if (governmentId) {
        guide.guideProfile.governmentId = governmentId;
        // Admin will verify this later
        guide.guideProfile.governmentIdVerified = false;
      }
      if (req.body.certificates) {
        guide.guideProfile.certificates = req.body.certificates;
      }

      await guide.save();

      res.json({
        success: true,
        guide,
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

// @route   GET /api/guides/:id/packages
// @desc    Get guide's packages
// @access  Public
router.get('/:id/packages', async (req, res) => {
  try {
    const packages = await Package.find({
      guide: req.params.id,
      isActive: true,
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      count: packages.length,
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

// @route   GET /api/guides/:id/reviews
// @desc    Get guide's reviews
// @access  Public
router.get('/:id/reviews', async (req, res) => {
  try {
    const bookings = await Booking.find({
      guide: req.params.id,
      status: 'completed',
      rating: { $exists: true, $ne: null },
    })
      .populate('tourist', 'name avatar')
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({
      success: true,
      count: bookings.length,
      reviews: bookings.map((booking) => ({
        tourist: booking.tourist,
        rating: booking.rating,
        review: booking.review,
        createdAt: booking.createdAt,
      })),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

// @route   PUT /api/guides/bookings/:id/status
// @desc    Update booking status (Confirm/Reject)
// @access  Private (Guide only)
router.put('/bookings/:id/status', protect, authorize('guide'), async (req, res) => {
  try {
    const { status } = req.body; // 'confirmed' or 'cancelled'
    const booking = await Booking.findOne({ _id: req.params.id, guide: req.user._id });

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    booking.status = status;
    booking.updatedAt = Date.now();
    await booking.save();

    // Notify user via socket if needed (handled in bookings.js usually, but good to have here too)

    res.json({ success: true, booking });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   PUT /api/guides/profile/password
// @desc    Update guide password
// @access  Private (Guide only)
router.put('/profile/password', protect, authorize('guide'), async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');

    if (!(await user.matchPassword(currentPassword))) {
      return res.status(401).json({ success: false, message: 'Invalid current password' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;

