const express = require('express');
const mongoose = require('mongoose');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Package = require('../models/Package');
const Booking = require('../models/Booking');
const Transaction = require('../models/Transaction');
const Payout = require('../models/Payout');
const { protect, authorize } = require('../middleware/auth');
const { createNotification } = require('../utils/notify');
const { recordTransaction } = require('../utils/finance');

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

// @route   GET /api/guides/dashboard
// @desc    Get guide dashboard statistics
// @access  Private (Guide only)
router.get('/dashboard', protect, authorize('guide'), async (req, res) => {
  try {
    const guideId = new mongoose.Types.ObjectId(req.user._id);

    // 1. Core Facet Aggregation for Financials
    const financialSummary = await Transaction.aggregate([
      { $match: { user: guideId } },
      {
        $facet: {
          wallet: [
            {
              $group: {
                _id: null,
                balance: {
                  $sum: {
                    $cond: [{ $eq: ["$type", "credit"] }, "$amount", { $multiply: ["$amount", -1] }]
                  }
                },
                gross: {
                  $sum: { $cond: [{ $eq: ["$type", "credit"] }, "$amount", 0] }
                }
              }
            }
          ],
          monthly: [
            {
              $match: {
                type: 'credit',
                createdAt: { $gte: new Date(new Date().setMonth(new Date().getMonth() - 6)) }
              }
            },
            {
              $group: {
                _id: { month: { $month: "$createdAt" }, year: { $year: "$createdAt" } },
                total: { $sum: "$amount" }
              }
            },
            { $sort: { "_id.year": 1, "_id.month": 1 } }
          ],
          history: [
            { $sort: { createdAt: -1 } },
            { $limit: 10 },
            {
              $lookup: {
                from: 'bookings',
                localField: 'booking',
                foreignField: '_id',
                as: 'bookingDetails'
              }
            },
            { $unwind: { path: "$bookingDetails", preserveNullAndEmptyArrays: true } },
            {
              $lookup: {
                from: 'users',
                localField: 'bookingDetails.tourist',
                foreignField: '_id',
                as: 'touristInfo'
              }
            },
            { $unwind: { path: "$touristInfo", preserveNullAndEmptyArrays: true } },
            {
              $lookup: {
                from: 'packages',
                localField: 'bookingDetails.package',
                foreignField: '_id',
                as: 'packageInfo'
              }
            },
            { $unwind: { path: "$packageInfo", preserveNullAndEmptyArrays: true } }
          ]
        }
      }
    ]);

    // 2. Auxiliary Stats
    const [bookingStats, potentialStats, upcomingTripsList] = await Promise.all([
      Booking.aggregate([
        { $match: { guide: guideId } },
        {
          $group: {
            _id: null,
            totalTrekkers: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, "$numberOfPeople", 0] } },
            upcomingTripsCount: { $sum: { $cond: [{ $in: ["$status", ["confirmed", "pending"]] }, 1, 0] } },
            pendingRequests: { $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] } }
          }
        }
      ]),
      Booking.aggregate([
        { $match: { guide: guideId, status: 'confirmed', paymentStatus: 'pending' } },
        { $group: { _id: null, total: { $sum: { $subtract: ["$totalAmount", { $ifNull: ["$commission", { $multiply: ["$totalAmount", 0.1] }] }] } } } }
      ]),
      Booking.find({ guide: guideId, status: 'confirmed' }).populate('tourist', 'name')
    ]);

    const financials = financialSummary && financialSummary[0] ? financialSummary[0] : {};
    const wallet   = (financials.wallet && financials.wallet.length > 0) ? financials.wallet[0] : { balance: 0, gross: 0 };
    const bStats   = (bookingStats && bookingStats.length > 0) ? bookingStats[0] : { totalTrekkers: 0, upcomingTripsCount: 0, pendingRequests: 0 };
    const pStats   = (potentialStats && potentialStats.length > 0) ? potentialStats[0] : { total: 0 };

    res.json({
      success: true,
      stats: {
        grossEarnings:   wallet.gross || 0,
        netEarnings:     wallet.balance || 0,
        walletBalance:   wallet.balance || 0,
        totalCommission: (wallet.gross || 0) - (wallet.balance || 0),
        potentialEarnings: pStats.total || 0,
        upcomingTrips:   bStats.upcomingTripsCount || 0,
        pendingRequests: bStats.pendingRequests || 0,
        totalTrekkers:   bStats.totalTrekkers || 0,
        rating:          req.user?.guideProfile?.rating || 0,
      },
      upcomingTrips:      upcomingTripsList || [],
      monthlyEarnings:    financials.monthly || [],
      transactionHistory: financials.history || [],
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Fiscal infrastructure failed to aggregate.',
      error: error.message,
    });
  }
});

// @route   GET /api/guides/payouts
// @desc    Get guide's payout history
// @access  Private (Guide only)
router.get('/payouts', protect, authorize('guide'), async (req, res) => {
  try {
    const payouts = await Payout.find({ guide: req.user._id }).sort({ requestedAt: -1 });
    res.json({ success: true, payouts });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
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

    // Get guide's completed bookings count
    const bookingsCount = await Booking.countDocuments({
      guide: guide._id,
      status: 'completed',
    });

    // Total number of people guided across all completed bookings
    const peopleStats = await Booking.aggregate([
      { $match: { guide: guide._id, status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$numberOfPeople' } } },
    ]);
    const totalPeopleLed = peopleStats[0]?.total || 0;

    res.json({
      success: true,
      guide: {
        ...guide.toObject(),
        packages,
        bookingsCount,
        totalPeopleLed,
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
      const isNewVerificationRequest = governmentId && !guide.guideProfile.governmentId;
      if (governmentId) {
        guide.guideProfile.governmentId = governmentId;
        // Admin will verify this later
        guide.guideProfile.governmentIdVerified = false;
      }
      if (req.body.certificates) {
        guide.guideProfile.certificates = req.body.certificates;
      }

      await guide.save();

      // Notify all admins when a guide submits their government ID for verification
      if (governmentId) {
        const admins = await User.find({ role: 'admin' });
        for (const admin of admins) {
          await createNotification(req.app, {
            recipient: admin._id,
            sender: req.user._id,
            type: 'verification',
            title: 'Guide Verification Request',
            message: `${req.user.name} has submitted their government ID for verification. Please review and verify their profile.`,
            extraData: { guideId: req.user._id }
          });
        }
      }

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

// @route   POST /api/guides/payout/request
// @desc    Guide requests a wallet withdrawal
// @access  Private (Guide only)
router.post('/payout/request',
  protect,
  authorize('guide'),
  [
    body('amount').isFloat({ min: 1000 }).withMessage('Minimum payout is Rs. 1000'),
    body('bankName').trim().notEmpty().withMessage('Bank name is required'),
    body('accountHolder').trim().notEmpty().withMessage('Account holder name is required'),
    body('accountNumber').trim().notEmpty().withMessage('Account number is required'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const { amount, bankName, accountHolder, accountNumber, note } = req.body;
      const guideId = new mongoose.Types.ObjectId(req.user._id);

      // Block if a pending payout already exists
      const existing = await Payout.findOne({ guide: req.user._id, status: 'pending' });
      if (existing) {
        return res.status(400).json({ success: false, message: 'You already have a pending payout request. Please wait for it to be processed.' });
      }

      // Calculate current wallet balance from transactions
      const result = await Transaction.aggregate([
        { $match: { user: guideId } },
        { $group: { _id: null, balance: { $sum: { $cond: [{ $eq: ['$type', 'credit'] }, '$amount', { $multiply: ['$amount', -1] }] } } } }
      ]);
      const walletBalance = result[0]?.balance || 0;

      if (amount > walletBalance) {
        return res.status(400).json({
          success: false,
          message: `Insufficient balance. Your current wallet balance is Rs. ${walletBalance.toLocaleString()}.`
        });
      }

      const payout = await Payout.create({
        guide: req.user._id,
        amount,
        bankName,
        accountHolder,
        accountNumber,
        note: note || ''
      });

      // Notify all admins
      const admins = await User.find({ role: 'admin' });
      for (const admin of admins) {
        await createNotification(req.app, {
          recipient: admin._id,
          sender: req.user._id,
          type: 'system',
          title: 'Guide Payout Request',
          message: `${req.user.name} has requested a payout of Rs. ${amount.toLocaleString()} to ${bankName}.`,
          extraData: { payoutId: payout._id }
        });
      }

      res.status(201).json({ success: true, message: 'Payout request submitted. Admin will process it shortly.', payout });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
  }
);


module.exports = router;

