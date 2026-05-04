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
      const message = await Message.create({
        sender: socket.user.id,
        receiver: receiverId,
        body
      });

      // Emit to receiver's personal room
      io.to(receiverId).emit('new_message', {
        senderId: socket.user.id,
        body,
        createdAt: message.createdAt
      });
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.user.name}`);
    });
  });
};

module.exports = socketConfig;
