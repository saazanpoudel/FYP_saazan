const mongoose = require('mongoose');

const packageSchema = new mongoose.Schema({
  guide: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
  },
  destination: {
    type: String,
    required: true,
  },
  duration: {
    type: Number,
    required: true, // in days
  },
  price: {
    type: Number,
    required: true,
  },
  maxPeople: {
    type: Number,
    default: 10,
  },
  maxGroupSize: { // Alias for maxPeople
    type: Number,
    default: 10,
  },
  includes: [String],
  excludes: [String],
  itinerary: [
    {
      day: Number,
      title: String,
      activities: [String],
      description: String,
      accommodation: String,
    },
  ],
  images: [String],
  difficulty: {
    type: String,
    enum: ['easy', 'moderate', 'hard', 'extreme'],
    default: 'moderate',
  },
  category: {
    type: String,
    enum: ['trekking', 'cultural', 'adventure', 'wildlife', 'religious', 'other'],
    default: 'other',
  },
  isActive: {
    type: Boolean,
    default: true,
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

module.exports = mongoose.model('Package', packageSchema);

