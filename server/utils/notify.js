const Notification = require('../models/Notification');

/**
 * Creates a notification in the database and emits it via socket.io
 * @param {Object} app - Express app instance to get io
 * @param {Object} data - Notification data
 */
const createNotification = async (app, { recipient, sender, type, title, message, extraData = {} }) => {
    try {
        const notification = await Notification.create({
            recipient,
            sender,
            type,
            title,
            message,
            data: extraData
        });

        const io = app.get('io');
        if (io) {
            io.to(`user-${recipient}`).emit('new-notification', {
                notification,
                message: title
            });
        }

        return notification;
    } catch (error) {
        console.error('Failed to create notification:', error);
    }
};

module.exports = { createNotification };
