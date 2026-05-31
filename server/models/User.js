const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    minlength: 6,
    select: false,
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true,
  },
  role: {
    type: String,
    enum: ['tourist', 'guide', 'admin'],
    required: true,
  },
  phone: {
    type: String,
    trim: true,
  },
  avatar: {
    type: String,
    default: '',
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  // Tourist specific fields
  preferences: {
    languages: [String],
    interests: [String],
    emergencyContacts: [
      {
        name: String,
        phone: String,
        relationship: String,
      },
    ],
  },
  // Guide specific fields
  guideProfile: {
    governmentId: {
      type: String,
      default: '',
    },
    governmentIdVerified: {
      type: Boolean,
      default: false,
    },
    specialization: [String],
    experience: {
      type: Number,
      default: 0,
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    totalRatings: {
      type: Number,
      default: 0,
    },
    languages: [String],
    bio: {
      type: String,
      default: '',
    },
    portfolio: [String], // Array of image URLs
    earnings: {
      type: Number,
      default: 0,
    },
    certificates: [
      {
        name: String,
        url: String,
        issuedBy: String,
        issueDate: Date,
      },
    ],
    availability: {
      type: Map,
      of: Boolean,
      default: {},
    },
    availabilityRanges: [
      {
        startDate: Date,
        endDate: Date,
        note: String
      }
    ],
    recurringDays: {
      type: [String],
      default: []
    },
    unavailabilityExceptions: [Date], // Explicitly blocked dates
    location: {
      lat: { type: Number, default: 27.7172 }, // Default to Kathmandu
      lng: { type: Number, default: 85.3240 },
      address: String,
    },
  },
  // Gamification
  points: {
    type: Number,
    default: 0,
  },
  badges: [String],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  lastLogin: {
    type: Date,
  },
  resetPasswordToken: {
    type: String,
    select: false,
  },
  resetPasswordExpire: {
    type: Date,
    select: false,
  },
});

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password method
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Virtual for profile completeness
userSchema.virtual('isProfileComplete').get(function () {
  if (this.role !== 'guide') return true;
  const { bio, experience, specialization, governmentId, languages } = this.guideProfile || {};
  return !!(bio && experience && specialization?.length > 0 && governmentId && languages?.length > 0);
});

// Virtual for verified status
userSchema.virtual('isVerifiedGuide').get(function () {
  return this.role === 'guide' && this.guideProfile?.governmentIdVerified === true;
});

// Ensure virtuals are included in JSON
userSchema.set('toJSON', { virtuals: true });
userSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('User', userSchema);

