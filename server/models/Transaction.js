const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
  },
  type: {
    type: String,
    enum: ['credit', 'debit'], // credit = earnings, debit = payouts/refunds
    required: true,
  },
  category: {
    type: String,
    enum: ['booking_payment', 'payout', 'refund_compensation', 'refund_deduction', 'bonus', 'adjustment'],
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  currency: {
    type: String,
    default: 'NPR',
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'completed',
  },
  description: {
    type: String,
    required: true,
  },
  metadata: {
    type: Object,
    default: {},
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Transaction', transactionSchema);
