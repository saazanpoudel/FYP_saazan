const mongoose = require('mongoose');

const payoutSchema = new mongoose.Schema({
  guide: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  amount: {
    type: Number,
    required: true,
    min: [1000, 'Minimum payout is Rs. 1000'],
  },
  bankName: { type: String, required: true },
  accountHolder: { type: String, required: true },
  accountNumber: { type: String, required: true },
  note: { type: String, default: '' },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
  adminNote: { type: String, default: '' },
  processedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  proofImage: { type: String, default: '' },
  requestedAt: { type: Date, default: Date.now },
  processedAt: { type: Date },
});

module.exports = mongoose.model('Payout', payoutSchema);
