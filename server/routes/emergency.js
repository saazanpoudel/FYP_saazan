const express = require('express');
const { protect } = require('../middleware/auth');
const User = require('../models/User');

const router = express.Router();

// @route   POST /api/emergency/sos
// @desc    Broadcast emergency SOS alert
// @access  Private
router.post('/sos', protect, async (req, res) => {
    try {
        const { location, message } = req.body;

        // In a real app, this would send SMS/Emails
        // For now, we broadcast via Socket.io to all admins and nearby guides
        const io = req.app.get('io');

        if (io) {
            // General broadcast for demonstration
            io.emit('emergency-alert', {
                userId: req.user._id,
                userName: req.user.name,
                location,
                message: message || 'EMERGENCY: Assistance needed immediately!',
                timestamp: new Date()
            });

            // Log the SOS event
            console.log(`[SOS ALERT] User ${req.user.name} (${req.user._id}) at ${JSON.stringify(location)}`);
        }

        res.json({
            success: true,
            message: 'SOS Alert broadcasted to emergency responders.'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to send SOS alert',
            error: error.message
        });
    }
});

module.exports = router;
