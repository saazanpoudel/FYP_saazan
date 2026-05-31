const express = require('express');
const mongoose = require('mongoose');
const User = require('../models/User');
const Booking = require('../models/Booking');
const Package = require('../models/Package');
const Group = require('../models/Group');
const AuditLog = require('../models/AuditLog');
const Payout = require('../models/Payout');
const { protect, authorize } = require('../middleware/auth');
const { createNotification } = require('../utils/notify');
const { recordTransaction } = require('../utils/finance');

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

    const totalPackages = await Package.countDocuments({ isActive: true, status: 'approved' });
    const pendingPackages = await Package.countDocuments({ isActive: true, status: 'pending' });
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
        pendingPackages,
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

    // Persistent notification to guide
    await createNotification(req.app, {
      recipient: guide._id,
      sender: req.user._id,
      type: 'verification',
      title: 'Guide Profile Verified!',
      message: 'Congratulations! Your guide profile has been verified by the admin. You can now create packages and accept bookings.',
      extraData: { verifiedAt: new Date() }
    });

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
      // Restore the frozen funds back to guide wallet
      const resolvedBooking = await Booking.findById(booking._id).populate('package', 'title');
      const netYield = resolvedBooking.totalAmount - (resolvedBooking.commission || resolvedBooking.totalAmount * 0.1);
      await recordTransaction({
        userId: booking.guide,
        bookingId: booking._id,
        amount: netYield,
        type: 'credit',
        category: 'adjustment',
        description: `Dispute resolved in your favour for "${resolvedBooking.package?.title || 'Trek'}". Funds restored.`
      });
    } else if (action === 'refund') {
      booking.status = 'cancelled';
      booking.paymentStatus = 'refunded';
    }

    booking.disputeReason = resolution || booking.disputeReason;
    await booking.save();

    const resolvedBooking = await Booking.findById(booking._id).populate('package', 'title');
    const disputeTitle = action === 'resolve' ? 'Dispute Resolved' : 'Dispute Settled — Refund Issued';
    const disputeMsg = action === 'resolve'
      ? `The dispute for "${resolvedBooking.package?.title || 'Trek'}" has been resolved by admin. Booking marked as completed.`
      : `The dispute for "${resolvedBooking.package?.title || 'Trek'}" has been settled. A refund has been issued.`;

    await createNotification(req.app, {
      recipient: booking.tourist,
      sender: req.user._id,
      type: 'booking',
      title: disputeTitle,
      message: disputeMsg,
      extraData: { bookingId: booking._id, action }
    });
    await createNotification(req.app, {
      recipient: booking.guide,
      sender: req.user._id,
      type: 'booking',
      title: disputeTitle,
      message: disputeMsg,
      extraData: { bookingId: booking._id, action }
    });

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

    await createNotification(req.app, {
      recipient: user._id,
      sender: req.user._id,
      type: 'system',
      title: isActive ? 'Account Activated' : 'Account Deactivated',
      message: isActive
        ? 'Your account has been activated by the admin. Welcome back!'
        : 'Your account has been deactivated by an admin. Contact support if you believe this is an error.',
      extraData: { isActive }
    });

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

// @route   GET /api/admin/refunds
// @desc    Get all pending refund requests
// @access  Private (Admin only)
router.get('/refunds', async (req, res) => {
  try {
    const refunds = await Booking.find({
      status: 'cancelled'
    })
    .sort({ createdAt: -1 })
    .populate('tourist', 'name email phone avatar')
    .populate('guide', 'name email')
    .sort({ 'refundDetails.requestedAt': -1 });

    res.json({ success: true, count: refunds.length, refunds });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/admin/refunds/:id/approve
// @desc    Approve refund and upload proof
// @access  Private (Admin only)
router.put('/refunds/:id/approve', async (req, res) => {
  try {
    const { proofImage } = req.body;
    if (!proofImage) {
      return res.status(400).json({ success: false, message: 'Refund payment screenshot is required' });
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking || booking.status !== 'cancelled') {
        return res.status(404).json({ success: false, message: 'Matching cancelled trip not found' });
    }

    booking.refundDetails.status = 'processed';
    booking.refundDetails.proofImage = proofImage;
    booking.refundDetails.processedAt = new Date();
    await booking.save();

    // Log the audit event
    await AuditLog.create({
      admin: req.user._id,
      action: 'FISCAL_REFUND_PROCESSED',
      targetType: 'Booking',
      targetId: booking._id,
      details: `Refund of Rs. ${booking.refundDetails.refundAmount} approved and processed. Proof uploaded.`,
      severity: 'info'
    });

    // Notify tourist that refund has been processed
    const refundedBooking = await Booking.findById(booking._id).populate('package', 'title');
    await createNotification(req.app, {
      recipient: booking.tourist,
      sender: req.user._id,
      type: 'system',
      title: 'Refund Processed',
      message: `Your refund of Rs. ${booking.refundDetails.refundAmount} for "${refundedBooking.package?.title || 'Trek'}" has been processed and sent to your bank account (${booking.refundDetails.bankName}). Please allow 3-5 business days.`,
      extraData: { bookingId: booking._id, refundAmount: booking.refundDetails.refundAmount }
    });

    res.json({ success: true, message: 'Refund processed successfully', booking });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// @route   GET /api/admin/users/:id/details
// @desc    Get detailed user profile, bookings and earnings (for guides)
// @access  Private (Admin only)
router.get('/users/:id/details', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const userId = new mongoose.Types.ObjectId(req.params.id);
    let details = {
      user,
      bookings: [],
      stats: {}
    };

    if (user.role === 'guide') {
      // Guide specific details
      const [bookings, packages, stats, monthly] = await Promise.all([
        Booking.find({ guide: userId }).populate('tourist', 'name email avatar').populate('package', 'title').sort({ createdAt: -1 }),
        Package.find({ guide: userId }),
        Booking.aggregate([
          { 
            $match: { 
              guide: userId, 
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
          }
        ]),
        Booking.aggregate([
          {
            $match: {
              guide: userId,
              status: { $in: ['confirmed', 'completed'] },
              paymentStatus: 'paid',
            },
          },
          {
            $group: {
              _id: {
                month: { $month: '$createdAt' },
                year: { $year: '$createdAt' },
              },
              total: { $sum: { $subtract: ["$totalAmount", { $ifNull: ["$commission", { $multiply: ["$totalAmount", 0.1] }] }] } }
            },
          },
          { $sort: { '_id.year': -1, '_id.month': -1 } },
          { $limit: 12 }
        ])
      ]);

      details.bookings = bookings;
      details.packages = packages;
      details.stats = {
        grossEarnings: stats[0]?.gross || 0,
        netEarnings: stats[0]?.net || 0,
        totalBookings: bookings.length,
        completedBookings: bookings.filter(b => b.status === 'completed').length,
      };
      details.monthlyEarnings = monthly;
    } else {
      // Tourist specific details
      const bookings = await Booking.find({ tourist: userId })
        .populate('guide', 'name email avatar')
        .populate('package', 'title')
        .sort({ createdAt: -1 });

      details.bookings = bookings;
      details.stats = {
        totalBookings: bookings.length,
        completedBookings: bookings.filter(b => b.status === 'completed').length,
        totalSpent: bookings.reduce((acc, b) => acc + (b.paymentStatus === 'paid' ? b.totalAmount : 0), 0)
      };
    }

    res.json({ success: true, details });
  } catch (error) {
    console.error('USER_DETAILS_ERROR:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// @route   GET /api/admin/groups
// @desc    Get all groups for administration
// @access  Private (Admin only)
router.get('/groups', async (req, res) => {
  try {
    const groups = await Group.find()
      .populate('creator', 'name email')
      .populate('members.user', 'name email avatar')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: groups.length,
      groups
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// @route   GET /api/admin/packages/pending
// @desc    Get all packages awaiting approval
// @access  Private (Admin only)
router.get('/packages/pending', async (req, res) => {
  try {
    const packages = await Package.find({ isActive: true, status: 'pending' })
      .populate('guide', 'name email avatar guideProfile')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: packages.length, packages });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// @route   GET /api/admin/packages/all
// @desc    Get all packages with status info
// @access  Private (Admin only)
router.get('/packages/all', async (req, res) => {
  try {
    const packages = await Package.find({ isActive: true })
      .populate('guide', 'name email avatar')
      .populate('reviewedBy', 'name')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: packages.length, packages });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// @route   PATCH /api/admin/packages/:id/approve
// @desc    Approve a pending package
// @access  Private (Admin only)
router.patch('/packages/:id/approve', async (req, res) => {
  try {
    const pkg = await Package.findById(req.params.id).populate('guide', 'name');
    if (!pkg) {
      return res.status(404).json({ success: false, message: 'Package not found' });
    }

    pkg.status = 'approved';
    pkg.reviewedBy = req.user._id;
    pkg.reviewedAt = new Date();
    pkg.rejectionReason = undefined;
    await pkg.save();

    await createNotification(req.app, {
      recipient: pkg.guide._id,
      sender: req.user._id,
      type: 'system',
      title: 'Package Approved',
      message: `Your package '${pkg.title}' has been approved and is now live.`,
      extraData: { packageId: pkg._id },
    });

    res.json({ success: true, package: pkg });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// @route   PATCH /api/admin/packages/:id/reject
// @desc    Reject a pending package with a reason
// @access  Private (Admin only)
router.patch('/packages/:id/reject', async (req, res) => {
  try {
    const { rejectionReason } = req.body;
    if (!rejectionReason || !rejectionReason.trim()) {
      return res.status(400).json({ success: false, message: 'Rejection reason is required' });
    }

    const pkg = await Package.findById(req.params.id).populate('guide', 'name');
    if (!pkg) {
      return res.status(404).json({ success: false, message: 'Package not found' });
    }

    pkg.status = 'rejected';
    pkg.rejectionReason = rejectionReason.trim();
    pkg.reviewedBy = req.user._id;
    pkg.reviewedAt = new Date();
    await pkg.save();

    await createNotification(req.app, {
      recipient: pkg.guide._id,
      sender: req.user._id,
      type: 'system',
      title: 'Package Rejected',
      message: `Your package '${pkg.title}' was rejected. Reason: ${rejectionReason.trim()}`,
      extraData: { packageId: pkg._id },
    });

    res.json({ success: true, package: pkg });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// @route   GET /api/admin/payouts
// @desc    Get all payout requests
// @access  Private (Admin only)
router.get('/payouts', async (req, res) => {
  try {
    const { status } = req.query;
    const query = status ? { status } : {};
    const payouts = await Payout.find(query)
      .populate('guide', 'name email avatar guideProfile')
      .populate('processedBy', 'name')
      .sort({ requestedAt: -1 });
    res.json({ success: true, count: payouts.length, payouts });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/admin/payouts/:id/approve
// @desc    Approve payout — records debit transaction and marks as approved
// @access  Private (Admin only)
router.put('/payouts/:id/approve', async (req, res) => {
  try {
    const { proofImage } = req.body;
    if (!proofImage) {
      return res.status(400).json({ success: false, message: 'Payment proof screenshot is required' });
    }

    const payout = await Payout.findById(req.params.id).populate('guide', 'name');
    if (!payout) return res.status(404).json({ success: false, message: 'Payout request not found' });
    if (payout.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'This payout has already been processed' });
    }

    // Debit the guide's wallet
    await recordTransaction({
      userId: payout.guide._id,
      amount: payout.amount,
      type: 'debit',
      category: 'payout',
      description: `Payout of Rs. ${payout.amount.toLocaleString()} sent to ${payout.bankName} (${payout.accountNumber})`
    });

    payout.status = 'approved';
    payout.proofImage = proofImage;
    payout.processedBy = req.user._id;
    payout.processedAt = new Date();
    await payout.save();

    await AuditLog.create({
      admin: req.user._id,
      action: 'PAYOUT_APPROVED',
      targetType: 'Payout',
      targetId: payout._id,
      details: `Payout of Rs. ${payout.amount} approved for guide ${payout.guide.name}. Bank: ${payout.bankName}.`,
      severity: 'info'
    });

    await createNotification(req.app, {
      recipient: payout.guide._id,
      sender: req.user._id,
      type: 'payment',
      title: 'Payout Approved!',
      message: `Your payout of Rs. ${payout.amount.toLocaleString()} has been processed and sent to ${payout.bankName} (${payout.accountNumber}). Please allow 1-3 business days.`,
      extraData: { payoutId: payout._id }
    });

    res.json({ success: true, message: 'Payout approved and processed', payout });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/admin/payouts/:id/reject
// @desc    Reject a payout request
// @access  Private (Admin only)
router.put('/payouts/:id/reject', async (req, res) => {
  try {
    const { adminNote } = req.body;
    const payout = await Payout.findById(req.params.id).populate('guide', 'name');
    if (!payout) return res.status(404).json({ success: false, message: 'Payout request not found' });
    if (payout.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'This payout has already been processed' });
    }

    payout.status = 'rejected';
    payout.adminNote = adminNote || '';
    payout.processedBy = req.user._id;
    payout.processedAt = new Date();
    await payout.save();

    await createNotification(req.app, {
      recipient: payout.guide._id,
      sender: req.user._id,
      type: 'payment',
      title: 'Payout Request Rejected',
      message: `Your payout request of Rs. ${payout.amount.toLocaleString()} was not approved. ${adminNote ? `Reason: ${adminNote}` : 'Please contact support for details.'}`,
      extraData: { payoutId: payout._id }
    });

    res.json({ success: true, message: 'Payout request rejected', payout });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// @route   DELETE /api/admin/reviews/:bookingId
// @desc    Remove a review from a booking and recalculate guide rating
// @access  Private (Admin only)
router.delete('/reviews/:bookingId', async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }
    if (!booking.rating) {
      return res.status(400).json({ success: false, message: 'This booking has no review to remove' });
    }

    const deletedRating = booking.rating;

    // Recalculate guide's average rating
    const guide = await User.findById(booking.guide);
    const currentTotal  = guide.guideProfile.totalRatings || 0;
    const currentRating = guide.guideProfile.rating || 0;
    const newTotal = Math.max(0, currentTotal - 1);

    if (newTotal === 0) {
      guide.guideProfile.rating = 0;
      guide.guideProfile.totalRatings = 0;
    } else {
      guide.guideProfile.rating = (currentRating * currentTotal - deletedRating) / newTotal;
      guide.guideProfile.totalRatings = newTotal;
    }
    await guide.save();

    // Clear review from booking
    booking.rating = undefined;
    booking.review = '';
    await booking.save();

    await AuditLog.create({
      admin: req.user._id,
      action: 'REVIEW_DELETED',
      targetType: 'Booking',
      targetId: booking._id,
      details: `Admin removed ${deletedRating}-star review from booking ${booking._id}. Guide: ${guide.name}. New avg: ${guide.guideProfile.rating?.toFixed(2) || 0}.`,
      severity: 'warning'
    });

    res.json({ success: true, message: 'Review removed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

module.exports = router;

