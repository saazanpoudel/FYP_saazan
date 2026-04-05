const express = require('express');
const { body, validationResult } = require('express-validator');
const Booking = require('../models/Booking');
const Package = require('../models/Package');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { generateEsewaSignature } = require('../utils/esewa');

const ESEWA_SECRET_KEY = process.env.ESEWA_SECRET_KEY || '8gBm/:&EnhH.1/q(';
const ESEWA_PRODUCT_CODE = process.env.ESEWA_PRODUCT_CODE || 'EPAYTEST';
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';
const SERVER_URL = process.env.SERVER_URL || 'http://localhost:5000';

const ESEWA_URL = 'https://rc-epay.esewa.com.np/api/epay/main/v2/form';

const KHALTI_INITIATE_URL = 'https://dev.khalti.com/api/v2/epayment/initiate/';
const KHALTI_LOOKUP_URL = 'https://dev.khalti.com/api/v2/epayment/lookup/';

const router = express.Router();

// @route   POST /api/bookings
// @desc    Create a new booking
// @access  Private (Tourist)
router.post(
  '/',
  protect,
  [
    body('guide').notEmpty().withMessage('Guide ID is required'),
    body('startDate').isISO8601().withMessage('Valid start date is required'),
    body('endDate').isISO8601().withMessage('Valid end date is required'),
    body('numberOfPeople')
      .isInt({ min: 1 })
      .withMessage('Number of people must be at least 1'),
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
      const { guide, package: packageId, startDate, endDate, numberOfPeople, specialRequests, itinerary } = req.body;

      // Verify guide exists and check availability
      const guideUser = await User.findById(guide);
      if (!guideUser || guideUser.role !== 'guide') {
        return res.status(404).json({ success: false, message: 'Guide not found' });
      }

      // 1. Check for overlapping bookings
      const start = new Date(startDate);
      const end = new Date(endDate);
      const overlapping = await Booking.find({
        guide: guide,
        status: { $in: ['confirmed', 'completed', 'pending'] },
        $or: [
          { startDate: { $lte: end }, endDate: { $gte: start } }
        ]
      });

      if (overlapping.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Guide is already booked for these dates'
        });
      }

      // 2. Check manual availability (Seasonal ranges + Exceptions)
      const ranges = guideUser.guideProfile?.availabilityRanges || [];
      const exceptions = (guideUser.guideProfile?.unavailabilityExceptions || []).map(d => new Date(d).toISOString().split('T')[0]);
      const recDays = guideUser.guideProfile?.recurringDays || [];

      let curr = new Date(start);
      while(curr <= end) {
          const dStr = curr.toISOString().split('T')[0];
          const dayName = curr.toLocaleDateString('en-US', { weekday: 'long' });

          if (exceptions.includes(dStr)) {
            return res.status(400).json({ success: false, message: `Guide is unavailable on ${dStr}` });
          }

          if (ranges.length > 0) {
              const inRange = ranges.some(r => curr >= new Date(r.startDate) && curr <= new Date(r.endDate));
              if (!inRange) return res.status(400).json({ success: false, message: `Guide is out of their seasonal work window on ${dStr}` });
          } else if (recDays.length > 0) {
              if (!recDays.includes(dayName)) return res.status(400).json({ success: false, message: `Guide does not work on ${dayName}s` });
          }
          curr.setDate(curr.getDate() + 1);
      }

      let totalAmount = 0;
      let bookingPackage = null;

      if (packageId) {
        bookingPackage = await Package.findById(packageId);
        if (!bookingPackage) {
          return res.status(404).json({
            success: false,
            message: 'Package not found',
          });
        }
        totalAmount = bookingPackage.price * numberOfPeople;
      } else {
        // If no package, calculate based on guide's base rate
        // You can add a baseRate field to guideProfile
        totalAmount = 5000 * numberOfPeople; // Default rate
      }

      // Calculate commission (e.g., 10%)
      const commission = totalAmount * 0.1;

      const booking = await Booking.create({
        tourist: req.user._id,
        guide,
        package: packageId || null,
        startDate,
        endDate,
        numberOfPeople,
        totalAmount,
        commission,
        specialRequests,
        itinerary,
        status: 'pending',
      });

      const populatedBooking = await Booking.findById(booking._id)
        .populate('tourist', 'name email phone')
        .populate('guide', 'name email phone guideProfile')
        .populate('package');

      // Emit socket event for new booking notification
      const io = req.app.get('io');
      if (io) {
        io.to(`user-${guide}`).emit('new-booking', {
          booking: populatedBooking,
          message: 'You have a new booking request',
        });
      }

      res.status(201).json({
        success: true,
        booking: populatedBooking,
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

// @route   GET /api/bookings
// @desc    Get user's bookings
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { status, type } = req.query;
    let query = {};

    if (req.user.role === 'tourist') {
      query.tourist = req.user._id;
    } else if (req.user.role === 'guide') {
      query.guide = req.user._id;
    } else if (req.user.role === 'admin') {
      // Admin can see all bookings
    } else {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    if (status) {
      query.status = status;
    }

    const bookings = await Booking.find(query)
      .populate('tourist', 'name email phone avatar')
      .populate('guide', 'name email phone avatar guideProfile')
      .populate('package')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: bookings.length,
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

// @route   GET /api/bookings/:id
// @desc    Get single booking
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('tourist', 'name email phone avatar')
      .populate('guide', 'name email phone avatar guideProfile')
      .populate('package');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    // Check if user has access to this booking
    if (
      req.user.role !== 'admin' &&
      booking.tourist._id.toString() !== req.user._id.toString() &&
      booking.guide._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

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

// @route   PUT /api/bookings/:id/status
// @desc    Update booking status
// @access  Private
router.put(
  '/:id/status',
  protect,
  [body('status').isIn(['pending', 'confirmed', 'completed', 'cancelled']).withMessage('Invalid status')],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    try {
      const booking = await Booking.findById(req.params.id);

      if (!booking) {
        return res.status(404).json({
          success: false,
          message: 'Booking not found',
        });
      }

      // Check permissions
      const canUpdate =
        req.user.role === 'admin' ||
        booking.guide.toString() === req.user._id.toString() ||
        (booking.tourist.toString() === req.user._id.toString() && req.body.status === 'cancelled');

      if (!canUpdate) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to update this booking',
        });
      }

      booking.status = req.body.status;
      booking.updatedAt = new Date();
      await booking.save();

      // Award points and badges if completed
      if (req.body.status === 'completed') {
        const guide = await User.findById(booking.guide);

        // Base points for completion
        let pointsToAdd = 50;

        // Bonus points for high ratings
        if (booking.rating === 5) pointsToAdd += 30;
        else if (booking.rating === 4) pointsToAdd += 10;

        guide.points = (guide.points || 0) + pointsToAdd;

        // Badge Milestones
        const badges = new Set(guide.badges || []);

        if (guide.points >= 200 && !badges.has('Veteran Guide')) {
          badges.add('Veteran Guide');
        }
        if (guide.points >= 500 && !badges.has('Elite Expeditionist')) {
          badges.add('Elite Expeditionist');
        }
        if (guide.points >= 1000 && !badges.has('Himalayan Legend')) {
          badges.add('Himalayan Legend');
        }

        guide.badges = Array.from(badges);
        await guide.save();
      }

      const updatedBooking = await Booking.findById(booking._id)
        .populate('tourist', 'name email phone')
        .populate('guide', 'name email phone');

      // Emit socket event
      const io = req.app.get('io');
      if (io) {
        const notifyUserId =
          booking.tourist.toString() === req.user._id.toString()
            ? booking.guide.toString()
            : booking.tourist.toString();
        io.to(`user-${notifyUserId}`).emit('booking-updated', {
          booking: updatedBooking,
          message: `Booking status updated to ${req.body.status}`,
        });
      }

      res.json({
        success: true,
        booking: updatedBooking,
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

// @route   POST /api/bookings/:id/review
// @desc    Add review and rating to completed booking
// @access  Private (Tourist)
router.post(
  '/:id/review',
  protect,
  [
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
    body('review').optional().isString(),
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
      const booking = await Booking.findById(req.params.id);

      if (!booking) {
        return res.status(404).json({
          success: false,
          message: 'Booking not found',
        });
      }

      if (booking.tourist.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Only the tourist can add a review',
        });
      }

      if (booking.status !== 'completed') {
        return res.status(400).json({
          success: false,
          message: 'Can only review completed bookings',
        });
      }

      booking.rating = req.body.rating;
      booking.review = req.body.review || '';
      await booking.save();

      // Update guide's rating
      const guide = await User.findById(booking.guide);
      const totalRatings = guide.guideProfile.totalRatings + 1;
      const currentRating = guide.guideProfile.rating;
      const newRating = (currentRating * guide.guideProfile.totalRatings + req.body.rating) / totalRatings;

      guide.guideProfile.rating = newRating;
      guide.guideProfile.totalRatings = totalRatings;

      // Award bonus points for rating
      let bonusPoints = 0;
      if (req.body.rating === 5) bonusPoints = 30;
      else if (req.body.rating === 4) bonusPoints = 10;

      guide.points = (guide.points || 0) + bonusPoints;

      await guide.save();

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
  }
);

// @route   GET /api/bookings/payment/success
// @desc    eSewa Success Callback
// @access  Public (Redirected from eSewa)
router.get('/payment/success', async (req, res) => {
  try {
    const { data } = req.query;
    if (!data) return res.redirect(`${CLIENT_URL}/dashboard?status=error&message=No-data-from-esewa`);

    // Decode base64 data
    const decoded = Buffer.from(data, 'base64').toString('utf-8');
    const payload = JSON.parse(decoded);

    // Payload includes transaction_uuid which we used as booking_id
    const booking = await Booking.findById(payload.transaction_uuid);

    if (!booking) {
        return res.redirect(`${CLIENT_URL}/dashboard?status=error&message=Booking-not-found`);
    }

    // Verify amount in production
    // status should be 'COMPLETE'
    if (payload.status === 'COMPLETE') {
        booking.paymentStatus = 'paid';
        booking.transactionId = payload.transaction_code;
        booking.updatedAt = new Date();
        await booking.save();

        // Increment Guide's Liquid Balance (Net)
        const netYield = booking.totalAmount - (booking.commission || (booking.totalAmount * 0.1));
        await User.findByIdAndUpdate(booking.guide, {
          $inc: { 'guideProfile.earnings': netYield }
        });

        // Log Fiscal Event
        await require('../models/AuditLog').create({
          action: 'FISCAL_PAYMENT_SETTLED',
          targetType: 'Booking',
          targetId: booking._id,
          details: `eSewa Payment Settled. TxID: ${payload.transaction_code}. Net Yield: Rs. ${netYield}`,
          severity: 'info'
        });

        res.redirect(`${CLIENT_URL}/dashboard?status=success&message=Payment-received`);
    } else {
        res.redirect(`${CLIENT_URL}/dashboard?status=failed&message=Payment-failed`);
    }

  } catch (error) {
    console.error('eSewa error:', error);
    res.redirect(`${CLIENT_URL}/dashboard?status=error&message=System-error`);
  }
});

// @route   POST /api/bookings/:id/pay
// @desc    MOCK eSewa payment for testing
// @access  Private
router.post('/:id/pay', protect, async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res.status(404).json({ success: false, message: 'Booking not found' });
        }

        // MOCK SUCCESS FOR TESTING
        booking.paymentStatus = 'paid';
        booking.status = 'confirmed';
        booking.transactionId = 'MOCK-ESEWA-' + Date.now();
        booking.updatedAt = new Date();
        await booking.save();

        // Increment Guide's Liquid Balance (Net)
        const netYield = booking.totalAmount - (booking.commission || (booking.totalAmount * 0.1));
        await User.findByIdAndUpdate(booking.guide, {
          $inc: { 'guideProfile.earnings': netYield }
        });

        // Log Fiscal Event
        await require('../models/AuditLog').create({
          action: 'FISCAL_MOCK_PAYMENT',
          targetType: 'Booking',
          targetId: booking._id,
          details: `Mock Payment Confirmed. Net Yield: Rs. ${netYield}`,
          severity: 'info'
        });

        res.json({
            success: true,
            message: 'Payment confirmed (Mock Mode)',
            isMock: true
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

// @route   POST /api/bookings/:id/pay/khalti
// @desc    MOCK Khalti payment for testing
// @access  Private
router.post('/:id/pay/khalti', protect, async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res.status(404).json({ success: false, message: 'Booking not found' });
        }

        // MOCK SUCCESS FOR TESTING
        booking.paymentStatus = 'paid';
        booking.status = 'confirmed';
        booking.transactionId = 'MOCK-KHALTI-' + Date.now();
        booking.updatedAt = new Date();
        await booking.save();

        // Increment Guide's Liquid Balance (Net)
        const netYield = booking.totalAmount - (booking.commission || (booking.totalAmount * 0.1));
        await User.findByIdAndUpdate(booking.guide, {
          $inc: { 'guideProfile.earnings': netYield }
        });

        // Log Fiscal Event
        await require('../models/AuditLog').create({
          action: 'FISCAL_MOCK_PAYMENT',
          targetType: 'Booking',
          targetId: booking._id,
          details: `Mock Khalti Payment Confirmed. Net Yield: Rs. ${netYield}`,
          severity: 'info'
        });

        res.json({
            success: true,
            message: 'Payment confirmed (Mock Mode)',
            isMock: true
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

// @route   GET /api/bookings/payment/khalti/callback
// @desc    Khalti Success Callback
// @access  Public
router.get('/payment/khalti/callback', async (req, res) => {
    try {
        const { pidx, status, purchase_order_id } = req.query;

        console.log('Khalti Callback Query:', req.query);

        if (status !== 'Completed') {
            return res.redirect(`${CLIENT_URL}/dashboard?status=error&message=Payment-not-completed`);
        }

        // Verify with Khalti
        const response = await fetch(KHALTI_LOOKUP_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Key ${process.env.KHALTI_SECRET_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ pidx })
        });

        const data = await response.json();

        if (data.status === 'Completed') {
            const booking = await Booking.findById(purchase_order_id);
            if (booking) {
                booking.paymentStatus = 'paid';
                booking.transactionId = data.transaction_id || pidx;
                booking.updatedAt = new Date();
                await booking.save();

                // Increment Guide's Liquid Balance (Net)
                const netYield = booking.totalAmount - (booking.commission || (booking.totalAmount * 0.1));
                await User.findByIdAndUpdate(booking.guide, {
                  $inc: { 'guideProfile.earnings': netYield }
                });

                // Log Fiscal Event
                await require('../models/AuditLog').create({
                  action: 'FISCAL_PAYMENT_SETTLED',
                  targetType: 'Booking',
                  targetId: booking._id,
                  details: `Khalti Payment Settled. TxID: ${data.transaction_id || pidx}. Net Yield: Rs. ${netYield}`,
                  severity: 'info'
                });

                res.redirect(`${CLIENT_URL}/dashboard?status=success&message=Payment-received-via-khalti`);
            } else {
                res.redirect(`${CLIENT_URL}/dashboard?status=error&message=Booking-not-found`);
            }
        } else {
            res.redirect(`${CLIENT_URL}/dashboard?status=failed&message=Verification-failed`);
        }
    } catch (error) {
        console.error('Khalti callback error:', error);
        res.redirect(`${CLIENT_URL}/dashboard?status=error&message=System-error`);
    }
});

module.exports = router;

