const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Message = require('../models/Message');

const socketConfig = (io) => {
  // Auth middleware for Socket.io
  io.use(async (socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Authentication error'));

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = await User.findById(decoded.id);

      if (!socket.user || socket.user.status === 'suspended') {
        return next(new Error('Account suspended or not found'));
      }

      next();
    } catch (err) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.user.name}`);

    // Join personal room for private notifications/messages
    socket.join(socket.user.id.toString());

    socket.on('join_room', (courseId) => {
      socket.join(courseId);
      console.log(`User ${socket.user.name} joined room: ${courseId}`);
    });

    socket.on('leave_room', (courseId) => {
      socket.leave(courseId);
      console.log(`User ${socket.user.name} left room: ${courseId}`);
    });

    socket.on('send_message', async ({ receiverId, body }) => {
      try {
        const message = await Message.create({
          sender: socket.user.id,
          receiver: receiverId,
          body
        });

        // Emit to receiver's personal room
        io.to(receiverId).emit('new_message', {
          senderId: socket.user.id,
          senderName: socket.user.name,
          body,
          createdAt: message.createdAt
        });

        // Confirm delivery to sender
        socket.emit('message_sent', { messageId: message._id, createdAt: message.createdAt });
      } catch (err) {
        console.error('send_message error:', err.message);
        socket.emit('message_error', { message: 'Failed to send message. Please try again.' });
      }
    });

    socket.on('send_course_message', async ({ courseId, body }) => {
      try {
        const message = await Message.create({
          sender: socket.user.id,
          course: courseId,
          body
        });

        // Emit to course room
        io.to(courseId).emit('new_course_message', {
          _id: message._id,
          sender: {
            _id: socket.user.id,
            name: socket.user.name,
            avatar: socket.user.avatar,
            role: socket.user.role
          },
          course: courseId,
          body,
          createdAt: message.createdAt
        });

        // Confirm delivery to sender
        socket.emit('message_sent', { messageId: message._id, createdAt: message.createdAt });
      } catch (err) {
        console.error('send_course_message error:', err.message);
        socket.emit('message_error', { message: 'Failed to send course message. Please try again.' });
      }
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.user.name}`);
    });
  });
};

module.exports = socketConfig;
