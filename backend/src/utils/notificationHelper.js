const Notification = require('../models/Notification');
const socketManager = require('./socketManager');

/**
 * Create a notification and emit a socket event
 * @param {string} userId - ID of the user to notify
 * @param {string} type - Type of notification (announcement, message, grade, submission, live_session)
 * @param {string} referenceId - ID of the related object (assignment, course, etc.)
 * @param {string} message - Notification message
 */
exports.createNotification = async (userId, type, referenceId, message) => {
  try {
    const notification = await Notification.create({
      user: userId,
      type,
      referenceId,
      message,
    });

    // Emit via socket if available — don't crash if socket isn't ready
    try {
      const io = socketManager.getIO();
      io.to(userId.toString()).emit('notification', {
        _id: notification._id,
        type: notification.type,
        message: notification.message,
        isRead: notification.isRead,
        createdAt: notification.createdAt,
      });
    } catch {
      // Socket not initialized yet — notification is still saved to DB
    }

    return notification;
  } catch (err) {
    console.error('Notification Error:', err.message);
  }
};
