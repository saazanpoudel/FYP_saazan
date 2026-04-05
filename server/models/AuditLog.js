const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
    admin: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    action: {
        type: String, // e.g., 'VERIFY_GUIDE', 'DELETE_PACKAGE', 'SOS_SIGNAL'
        required: true,
    },
    targetType: {
        type: String, // 'User', 'Package', 'Booking'
    },
    targetId: {
        type: mongoose.Schema.Types.ObjectId,
    },
    details: {
        type: String,
    },
    severity: {
        type: String,
        enum: ['info', 'warning', 'critical'],
        default: 'info',
    },
    ipAddress: String,
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('AuditLog', auditLogSchema);
