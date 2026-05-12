let io;

module.exports = {
  init: (server) => {
    const socketIo = require('socket.io');
    io = socketIo(server, {
      cors: {
        origin: function (origin, callback) {
          const allowedOrigins = [
            'http://localhost:3000',
            'http://localhost:3001',
            process.env.CLIENT_URL,
            'https://virtual-learning-environment.vercel.app',
            'https://virtual-learning-environment-th7m.onrender.com',
            'https://unilearn-frontend.onrender.com',
            'https://virtual-learning-environment-nicvgjzhp-kofiy3853-dots-projects.vercel.app',
          ].filter(Boolean);

          if (
            !origin ||
            allowedOrigins.includes(origin) ||
            origin.endsWith('.vercel.app') ||
            origin.endsWith('.onrender.com')
          ) {
            return callback(null, true);
          }
          return callback(null, false);
        },
        methods: ['GET', 'POST'],
        credentials: true,
      },
    });
    return io;
  },
  getIO: () => {
    if (!io) {
      throw new Error('Socket.io not initialized!');
    }
    return io;
  },
};
