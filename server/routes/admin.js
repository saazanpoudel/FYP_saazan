const express = require('express');
const User = require('../models/User');
const Booking = require('../models/Booking');
const Package = require('../models/Package');
const Group = require('../models/Group');
const AuditLog = require('../models/AuditLog');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// All admin routes require admin role
router.use(protect);
router.use(authorize('admin'));

// @route   GET /api/admin/dashboard
// @desc    Get admin dashboard statistics
// @access  Private (Admin only)
router.get('/dashboard', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalTourists = await User.countDocuments({ role: 'tourist' });
    const totalGuides = await User.countDocuments({ role: 'guide' });
    const verifiedGuides = await User.countDocuments({
      role: 'guide',
      'guideProfile.governmentIdVerified': true,
    });
    const pendingVerifications = await User.countDocuments({
      role: 'guide',
      'guideProfile.governmentIdVerified': false,
      'guideProfile.governmentId': { $ne: '' },
    });

    const totalBookings = await Booking.countDocuments();
    const pendingBookings = await Booking.countDocuments({ status: 'pending' });
    const completedBookings = await Booking.countDocuments({ status: 'completed' });
    const cancelledBookings = await Booking.countDocuments({ status: 'cancelled' });

    const financeStats = await Booking.aggregate([
      { $match: { status: { $in: ['confirmed', 'completed'] }, paymentStatus: 'paid' } },
      { 
        $group: { 
          _id: null, 
          grossVolume: { $sum: '$totalAmount' },
          platformCommissions: { $sum: '$commission' },
          guidePayouts: { $sum: { $subtract: ['$totalAmount', '$commission'] } }
        } 
      },
    ]);

    const totalRevenueStats = financeStats[0] || { grossVolume: 0, platformCommissions: 0, guidePayouts: 0 };

    const totalPackages = await Package.countDocuments({ isActive: true });
    const totalGroups = await Group.countDocuments();

    // Recent bookings
    const recentBookings = await Booking.find()
      .populate('tourist', 'name email')
      .populate('guide', 'name email')
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      success: true,
      stats: {
        users: {
          total: totalUsers,
          tourists: totalTourists,
          guides: totalGuides,
          verifiedGuides,
          pendingVerifications,
        },
        bookings: {
          total: totalBookings,
          pending: pendingBookings,
          completed: completedBookings,
          cancelled: cancelledBookings,
        },
        revenue: {
          grossVolume: totalRevenueStats.grossVolume,
          totalProfit: totalRevenueStats.platformCommissions,
          guidePayouts: totalRevenueStats.guidePayouts,
        },
        packages: totalPackages,
        groups: totalGroups,
      },
      recentBookings,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

// @route   GET /api/admin/guides/pending
// @desc    Get guides pending verification
// @access  Private (Admin only)
router.get('/guides/pending', async (req, res) => {
  try {
    const guides = await User.find({
      role: 'guide',
      'guideProfile.governmentIdVerified': false,
      'guideProfile.governmentId': { $ne: '' },
    }).select('-password');

    res.json({
      success: true,
      count: guides.length,
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

// @route   PUT /api/admin/guides/:id/verify
// @desc    Verify a guide
// @access  Private (Admin only)
router.put('/guides/:id/verify', async (req, res) => {
  try {
    const guide = await User.findById(req.params.id);

    if (!guide || guide.role !== 'guide') {
      return res.status(404).json({
        success: false,
        message: 'Guide not found',
      });
    }

    guide.guideProfile.governmentIdVerified = true;
    guide.isVerified = true;
    await guide.save();

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.to(`user-${guide._id}`).emit('verification-approved', {
        message: 'Your guide profile has been verified!',
      });
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
});

// @route   GET /api/admin/bookings
// @desc    Get all bookings with filters
// @access  Private (Admin only)
router.get('/bookings', async (req, res) => {
  try {
    const { status, paymentStatus, search, page = 1, limit = 20 } = req.query;
    const query = {};

    if (status) query.status = status;
    if (paymentStatus) query.paymentStatus = paymentStatus;
    if (search) {
      query.$or = [
        { transactionId: { $regex: search, $options: 'i' } },
        { status: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const bookings = await Booking.find(query)
      .populate('tourist', 'name email phone')
      .populate('guide', 'name email phone')
      .populate('package')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Booking.countDocuments(query);

    res.json({
      success: true,
      count: bookings.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      bookings,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

// @route   GET /api/admin/audit-logs
// @desc    Get audit logs
// @access  Private (Admin only)
router.get('/audit-logs', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const logs = await AuditLog.find()
      .populate('admin', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await AuditLog.countDocuments();

    res.json({
      success: true,
      count: logs.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      logs
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/admin/bookings/:id/dispute
// @desc    Handle booking dispute
// @access  Private (Admin only)
router.put('/bookings/:id/dispute', async (req, res) => {
  try {
    const { action, resolution } = req.body;
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    if (action === 'resolve') {
      booking.status = 'completed';
      booking.disputeReason = '';
    } else if (action === 'refund') {
      booking.status = 'cancelled';
      booking.paymentStatus = 'refunded';
    }

    booking.disputeReason = resolution || booking.disputeReason;
    await booking.save();

    res.json({
      success: true,
      booking,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

// @route   GET /api/admin/users
// @desc    Get all users
// @access  Private (Admin only)
router.get('/users', async (req, res) => {
  try {
    const { role, isActive, search, page = 1, limit = 20 } = req.query;
    const query = {};

    if (role) query.role = role;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const users = await User.find(query)
      .select('-password')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      count: users.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      users,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

// @route   PUT /api/admin/users/:id/status
// @desc    Activate/Deactivate user
// @access  Private (Admin only)
router.put('/users/:id/status', async (req, res) => {
  try {
    const { isActive } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    user.isActive = isActive;
    await user.save();

    res.json({
      success: true,
      user,
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

