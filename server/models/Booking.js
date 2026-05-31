const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  tourist: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  guide: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  package: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Package',
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  numberOfPeople: {
    type: Number,
    required: true,
    default: 1,
  },
  totalAmount: {
    type: Number,
    required: true,
  },
  commission: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'completed', 'cancelled', 'disputed'],
    default: 'pending',
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'refunded'],
    default: 'pending',
  },
  paymentMethod: {
    type: String,
    default: 'esewa',
  },
  transactionId: {
    type: String,
    default: '',
  },
  itinerary: {
    type: [String],
    default: [],
  },
  specialRequests: {
    type: String,
    default: '',
  },
  rating: {
    type: Number,
    min: 0,
    max: 5,
  },
  review: {
    type: String,
    default: '',
  },
  disputeReason: {
    type: String,
    default: '',
  },
  refundDetails: {
    bankName: String,
    accountHolder: String,
    accountNumber: String,
    refundAmount: Number,
    requestedAt: Date,
    status: {
      type: String,
      enum: ['pending', 'processed'],
      default: 'pending'
    },
    companyShare: Number,
    guideShare: Number,
    proofImage: String,
    processedAt: Date
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Booking', bookingSchema);

