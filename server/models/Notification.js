const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    type: {
        type: String,
        enum: ['booking', 'message', 'group', 'system', 'verification', 'emergency', 'SOS', 'payment', 'review'],
        required: true,
    },
    title: {
        type: String,
        required: true,
    },
    message: {
        type: String,
        required: true,
    },
    data: {
        type: Object, // Extra context like bookingId, groupId etc.
    },
    isRead: {
        type: Boolean,
        default: false,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('Notification', notificationSchema);
