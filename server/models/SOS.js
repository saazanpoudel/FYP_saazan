const mongoose = require('mongoose');

const sosSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    booking: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Booking'
    },
    package: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Package'
    },
    location: {
        lat: Number,
        lng: Number
    },
    emergencyType: {
        type: String,
        required: true,
        enum: ['Medical', 'Injury', 'Lost', 'Weather', 'Other']
    },
    message: String,
    status: {
        type: String,
        enum: ['active', 'resolved'],
        default: 'active'
    }
}, { timestamps: true });

module.exports = mongoose.model('SOS', sosSchema);
