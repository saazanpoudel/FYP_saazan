const express = require('express');
const { body, validationResult } = require('express-validator');
const Booking = require('../models/Booking');
const Package = require('../models/Package');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { generateEsewaSignature, verifyEsewaSignature } = require('../utils/esewa');
const { createNotification } = require('../utils/notify');
const { recordTransaction } = require('../utils/finance');

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

      // Emit socket event and CREATE PERSISTENT NOTIFICATION
      await createNotification(req.app, {
        recipient: guide,
        sender: req.user._id,
        type: 'booking',
        title: 'New Booking Request',
        message: `${req.user.name} has requested a booking for ${bookingPackage?.title || 'Trek'}.`,
        extraData: { bookingId: booking._id }
      });

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
  [body('status').isIn(['pending', 'confirmed', 'completed', 'cancelled', 'disputed']).withMessage('Invalid status')],
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
        .populate('guide', 'name email phone')
        .populate('package', 'title');

      // Handle DISPUTED status - record a debit to freeze funds
      if (req.body.status === 'disputed' && booking.paymentStatus === 'paid') {
          const netYield = booking.totalAmount - (booking.commission !== undefined ? booking.commission : (booking.totalAmount * 0.1));
          await recordTransaction({
              userId: booking.guide,
              bookingId: booking._id,
              amount: netYield,
              type: 'debit',
              category: 'adjustment',
              description: `Funds frozen due to dispute on ${updatedBooking.package?.title || 'Trek'}`
          });

          // Notify all admins about the dispute
          const User = require('../models/User');
          const admins = await User.find({ role: 'admin' });
          for (const admin of admins) {
              await createNotification(req.app, {
                  recipient: admin._id,
                  sender: req.user._id,
                  type: 'booking',
                  title: 'Booking Dispute Filed',
                  message: `A dispute has been raised for "${updatedBooking.package?.title || 'Trek'}" booking by ${req.user.name}. Review required.`,
                  extraData: { bookingId: booking._id }
              });
          }
      }

      // Notify the other party about the status update
      const notifyUserId =
        booking.tourist.toString() === req.user._id.toString()
          ? booking.guide.toString()
          : booking.tourist.toString();

      const statusMessages = {
          confirmed: `Your booking for "${updatedBooking.package?.title || 'Trek'}" has been confirmed! Get ready for your adventure.`,
          completed: `Your booking for "${updatedBooking.package?.title || 'Trek'}" has been marked as completed.`,
          cancelled: `Your booking for "${updatedBooking.package?.title || 'Trek'}" has been cancelled.`,
          disputed: `A dispute has been raised for the booking "${updatedBooking.package?.title || 'Trek'}".`,
          pending: `Your booking for "${updatedBooking.package?.title || 'Trek'}" is pending confirmation.`,
      };

      await createNotification(req.app, {
        recipient: notifyUserId,
        sender: req.user._id,
        type: 'booking',
        title: `Booking ${req.body.status.charAt(0).toUpperCase() + req.body.status.slice(1)}`,
        message: statusMessages[req.body.status] || `Your booking status has been updated to: ${req.body.status}`,
        extraData: { bookingId: booking._id, status: req.body.status }
      });

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

      // Fix 2: Prevent duplicate reviews
      if (booking.rating) {
        return res.status(400).json({
          success: false,
          message: 'You have already submitted a review for this booking.',
        });
      }

      booking.rating = req.body.rating;
      booking.review = req.body.review || '';
      await booking.save();

      // Fix 1: Safe rating calculation — guard against undefined/NaN on first review
      const guide = await User.findById(booking.guide);
      const currentTotal  = guide.guideProfile.totalRatings || 0;
      const currentRating = guide.guideProfile.rating || 0;
      const totalRatings  = currentTotal + 1;
      const newRating     = (currentRating * currentTotal + req.body.rating) / totalRatings;

      guide.guideProfile.rating = newRating;
      guide.guideProfile.totalRatings = totalRatings;

      // Award bonus points for rating
      let bonusPoints = 0;
      if (req.body.rating === 5) bonusPoints = 30;
      else if (req.body.rating === 4) bonusPoints = 10;

      guide.points = (guide.points || 0) + bonusPoints;

      await guide.save();

      // Notify guide about the new review
      const reviewedBooking = await Booking.findById(booking._id).populate('package', 'title');
      const stars = '⭐'.repeat(req.body.rating);
      await createNotification(req.app, {
        recipient: booking.guide,
        sender: req.user._id,
        type: 'review',
        title: 'New Review Received',
        message: `${req.user.name} gave you ${stars} (${req.body.rating}/5) for "${reviewedBooking.package?.title || 'Trek'}". ${req.body.review ? `"${req.body.review.substring(0, 80)}${req.body.review.length > 80 ? '...' : ''}"` : ''}`,
        extraData: { bookingId: booking._id, rating: req.body.rating }
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
  }
);

// @route   GET /api/bookings/payment/success
// @desc    eSewa v2 success callback — eSewa redirects here with ?data=<base64>
// @access  Public
router.get('/payment/success', async (req, res) => {
  try {
    const { data } = req.query;
    if (!data) {
      return res.redirect(`${CLIENT_URL}/dashboard?payment=failed&reason=no-data`);
    }

    // 1. Decode base64 payload sent by eSewa
    let payload;
    try {
      const decoded = Buffer.from(data, 'base64').toString('utf-8');
      payload = JSON.parse(decoded);
    } catch {
      return res.redirect(`${CLIENT_URL}/dashboard?payment=failed&reason=invalid-payload`);
    }

    // 2. Verify HMAC-SHA256 signature from eSewa
    const isSignatureValid = verifyEsewaSignature(payload, ESEWA_SECRET_KEY);
    if (!isSignatureValid) {
      console.error('[eSewa] Signature mismatch. Payload:', payload);
      return res.redirect(`${CLIENT_URL}/dashboard?payment=failed&reason=signature-mismatch`);
    }

    // 3. Find booking using transaction_uuid (= our booking._id)
    const booking = await Booking.findById(payload.transaction_uuid).populate('package', 'title');
    if (!booking) {
      return res.redirect(`${CLIENT_URL}/dashboard?payment=failed&reason=booking-not-found`);
    }

    // 4. Verify amount — eSewa returns formatted strings like "1,000.0" so strip commas before parsing
    const expectedAmount = parseFloat(booking.totalAmount);
    const receivedAmount = parseFloat(String(payload.total_amount).replace(/,/g, ''));
    if (isNaN(receivedAmount) || Math.abs(receivedAmount - expectedAmount) > 0.01) {
      console.error(`[eSewa] Amount mismatch: expected ${expectedAmount}, received ${payload.total_amount}`);
      return res.redirect(`${CLIENT_URL}/dashboard?payment=failed&reason=amount-mismatch`);
    }

    // 5. Verify eSewa confirmed the transaction
    if (payload.status !== 'COMPLETE') {
      return res.redirect(`${CLIENT_URL}/dashboard?payment=failed&reason=not-complete`);
    }

    // 6. Guard against duplicate callbacks
    if (booking.paymentStatus === 'paid') {
      return res.redirect(`${CLIENT_URL}/dashboard?payment=success`);
    }

    // 7. Mark booking as paid and confirmed
    booking.paymentStatus = 'paid';
    booking.status = 'confirmed';
    booking.transactionId = payload.transaction_code;
    booking.paymentMethod = 'esewa';
    booking.updatedAt = new Date();
    await booking.save();

    // 8. Credit guide's wallet
    const netYield = booking.totalAmount - (booking.commission || booking.totalAmount * 0.1);
    await recordTransaction({
      userId: booking.guide,
      bookingId: booking._id,
      amount: netYield,
      type: 'credit',
      category: 'booking_payment',
      description: `eSewa payment received for "${booking.package?.title || 'Trek'}". Tx: ${payload.transaction_code}`,
    });

    // 9. Audit log
    await require('../models/AuditLog').create({
      action: 'FISCAL_PAYMENT_SETTLED',
      targetType: 'Booking',
      targetId: booking._id,
      details: `eSewa payment confirmed. TxCode: ${payload.transaction_code}. Amount: Rs. ${booking.totalAmount}. Net yield: Rs. ${netYield}`,
      severity: 'info',
    });

    // 10. Notify tourist and guide
    await createNotification(req.app, {
      recipient: booking.tourist,
      sender: booking.guide,
      type: 'payment',
      title: 'eSewa Payment Confirmed',
      message: `Your eSewa payment of Rs. ${booking.totalAmount} for "${booking.package?.title || 'Trek'}" has been confirmed. Your booking is now active!`,
      extraData: { bookingId: booking._id, txCode: payload.transaction_code }
    });
    await createNotification(req.app, {
      recipient: booking.guide,
      sender: booking.tourist,
      type: 'payment',
      title: 'Payment Received via eSewa',
      message: `eSewa payment of Rs. ${netYield} (net) has been credited to your wallet for "${booking.package?.title || 'Trek'}". Tx: ${payload.transaction_code}`,
      extraData: { bookingId: booking._id }
    });

    res.redirect(`${CLIENT_URL}/dashboard?payment=success`);
  } catch (error) {
    console.error('[eSewa callback error]', error);
    res.redirect(`${CLIENT_URL}/dashboard?payment=failed&reason=server-error`);
  }
});

// @route   POST /api/bookings/:id/pay/esewa/initiate
// @desc    Generate signed eSewa v2 form payload — frontend submits this form to eSewa
// @access  Private (Tourist)
router.post('/:id/pay/esewa/initiate', protect, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('package', 'title');

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Only the tourist who owns the booking can pay
    if (booking.tourist.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    if (booking.paymentStatus === 'paid') {
      return res.status(400).json({ success: false, message: 'This booking is already paid' });
    }

    const totalAmount = String(booking.totalAmount);
    const transactionUuid = String(booking._id); // reuse booking ID as unique transaction ID
    const productCode = ESEWA_PRODUCT_CODE;

    const signature = generateEsewaSignature(totalAmount, transactionUuid, productCode, ESEWA_SECRET_KEY);

    const formData = {
      amount: totalAmount,
      tax_amount: '0',
      total_amount: totalAmount,
      transaction_uuid: transactionUuid,
      product_code: productCode,
      product_service_charge: '0',
      product_delivery_charge: '0',
      success_url: `${SERVER_URL}/api/bookings/payment/success`,
      failure_url: `${CLIENT_URL}/dashboard?payment=failed`,
      signed_field_names: 'total_amount,transaction_uuid,product_code',
      signature,
    };

    res.json({ success: true, formData, esewa_url: ESEWA_URL });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// @route   POST /api/bookings/:id/pay
// @desc    MOCK eSewa payment — for development/testing only
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

        // Increment Guide's Liquid Balance (Net) via Infrastructure
        const netYield = booking.totalAmount - (booking.commission || (booking.totalAmount * 0.1));
        await recordTransaction({
            userId: booking.guide,
            bookingId: booking._id,
            amount: netYield,
            type: 'credit',
            category: 'booking_payment',
            description: `Mock Payment processed for testing`
        });

        // Log Fiscal Event
        await require('../models/AuditLog').create({
          action: 'FISCAL_MOCK_PAYMENT',
          targetType: 'Booking',
          targetId: booking._id,
          details: `Mock Payment Confirmed. Net Yield: Rs. ${netYield}`,
          severity: 'info'
        });

        // Notify the tourist (confirmation) and the guide (payment received)
        const paidBooking = await Booking.findById(booking._id).populate('package', 'title');
        await createNotification(req.app, {
            recipient: booking.tourist,
            sender: booking.guide,
            type: 'payment',
            title: 'Payment Successful',
            message: `Your payment of Rs. ${booking.totalAmount} for "${paidBooking.package?.title || 'Trek'}" has been confirmed. Your booking is now active!`,
            extraData: { bookingId: booking._id }
        });
        await createNotification(req.app, {
            recipient: booking.guide,
            sender: booking.tourist,
            type: 'payment',
            title: 'Payment Received',
            message: `Payment of Rs. ${netYield} (net) has been credited to your wallet for "${paidBooking.package?.title || 'Trek'}".`,
            extraData: { bookingId: booking._id }
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

        // Increment Guide's Liquid Balance (Net) via Infrastructure
        const netYield = booking.totalAmount - (booking.commission || (booking.totalAmount * 0.1));
        await recordTransaction({
            userId: booking.guide,
            bookingId: booking._id,
            amount: netYield,
            type: 'credit',
            category: 'booking_payment',
            description: `Mock Khalti Payment processed for testing`
        });

        // Log Fiscal Event
        await require('../models/AuditLog').create({
          action: 'FISCAL_MOCK_PAYMENT',
          targetType: 'Booking',
          targetId: booking._id,
          details: `Mock Khalti Payment Confirmed. Net Yield: Rs. ${netYield}`,
          severity: 'info'
        });

        // Notify tourist (confirmation) and guide (payment received)
        const khaltiBooking = await Booking.findById(booking._id).populate('package', 'title');
        await createNotification(req.app, {
            recipient: booking.tourist,
            sender: booking.guide,
            type: 'payment',
            title: 'Payment Successful',
            message: `Your Khalti payment of Rs. ${booking.totalAmount} for "${khaltiBooking.package?.title || 'Trek'}" has been confirmed. Your booking is now active!`,
            extraData: { bookingId: booking._id }
        });
        await createNotification(req.app, {
            recipient: booking.guide,
            sender: booking.tourist,
            type: 'payment',
            title: 'Payment Received via Khalti',
            message: `Khalti payment of Rs. ${netYield} (net) has been credited to your wallet for "${khaltiBooking.package?.title || 'Trek'}".`,
            extraData: { bookingId: booking._id }
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

                // Increment Guide's Liquid Balance (Net) via Infrastructure
                const netYield = booking.totalAmount - (booking.commission || (booking.totalAmount * 0.1));
                await recordTransaction({
                    userId: booking.guide,
                    bookingId: booking._id,
                    amount: netYield,
                    type: 'credit',
                    category: 'booking_payment',
                    description: `Payment settled via Khalti for ${booking.package?.title || 'Trek'}`
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

// @route   POST /api/bookings/:id/cancel
// @desc    Cancel booking and request refund (60/20/20 split)
// @access  Private (Tourist)
router.post('/:id/cancel', protect, async (req, res) => {
    try {
        const { bankName, accountHolder, accountNumber } = req.body;
        
        if (!bankName || !accountHolder || !accountNumber) {
            return res.status(400).json({ success: false, message: 'Please provide all bank details for refund' });
        }

        const booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res.status(404).json({ success: false, message: 'Booking not found' });
        }

        if (booking.tourist.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        if (booking.status === 'cancelled' || booking.status === 'completed') {
            return res.status(400).json({ success: false, message: `Cannot cancel a ${booking.status} trip` });
        }

        const totalAmount = booking.totalAmount;
        const userRefund = totalAmount * 0.6;
        const guideShare = totalAmount * 0.2;
        const companyShare = totalAmount * 0.2;

        // If payment was already made, we need to adjust balances
        if (booking.paymentStatus === 'paid') {
            const previousNetYield = totalAmount - (booking.commission || (totalAmount * 0.1));
            // Deduct the difference from guide's earnings via Infrastructure
            const deduction = previousNetYield - guideShare;
            
            await recordTransaction({
                userId: booking.guide,
                bookingId: booking._id,
                amount: deduction,
                type: 'debit',
                category: 'refund_deduction',
                description: `Adjustment for cancelled trip. Guide retained 20% (Rs. ${guideShare})`
            });

            // Log the adjustment
            await require('../models/AuditLog').create({
                action: 'FISCAL_REFUND_ADJUSTMENT',
                targetType: 'Booking',
                targetId: booking._id,
                details: `Trip Cancelled. Guide compensated with 20% (Rs. ${guideShare}). Deducted Rs. ${deduction} from liquid balance.`,
                severity: 'warning'
            });
        }

        booking.status = 'cancelled';
        booking.paymentStatus = 'refunded';
        booking.refundDetails = {
            bankName,
            accountHolder,
            accountNumber,
            refundAmount: userRefund,
            requestedAt: new Date(),
            status: 'pending',
            companyShare,
            guideShare
        };

        await booking.save();

        const cancelledBooking = await Booking.findById(booking._id).populate('package', 'title');

        // Notify the guide about cancellation
        await createNotification(req.app, {
            recipient: booking.guide,
            sender: req.user._id,
            type: 'booking',
            title: 'Booking Cancelled by Tourist',
            message: `${req.user.name} has cancelled their booking for "${cancelledBooking.package?.title || 'Trek'}". You will retain 20% (Rs. ${guideShare}) of the total amount.`,
            extraData: { bookingId: booking._id }
        });

        // Notify all admins about the refund request
        const User = require('../models/User');
        const admins = await User.find({ role: 'admin' });
        for (const admin of admins) {
            await createNotification(req.app, {
                recipient: admin._id,
                sender: req.user._id,
                type: 'system',
                title: 'Refund Request Pending',
                message: `${req.user.name} has cancelled a booking for "${cancelledBooking.package?.title || 'Trek'}". A refund of Rs. ${userRefund} needs to be processed.`,
                extraData: { bookingId: booking._id, refundAmount: userRefund }
            });
        }

        res.json({
            success: true,
            message: 'Trip cancelled successfully. Refund of 60% will be processed to your bank.',
            refundAmount: userRefund
        });

    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

module.exports = router;

