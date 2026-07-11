const jwt = require('jsonwebtoken');
const { Server } = require('socket.io');

let io;

// Initialize Socket.io on top of the existing HTTP server
function init(server) {
  io = new Server(server, {
    cors: { origin: '*' },
  });

  // Authenticate every socket connection using the same JWT used for REST calls
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
      return next(new Error('Authentication required'));
    }
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    // personal room, used for notifications addressed to this user
    socket.join(`user:${socket.userId}`);

    // board rooms, used for real-time Kanban sync between viewers of the same board
    socket.on('joinBoard', (boardId) => {
      if (boardId) socket.join(`board:${boardId}`);
    });

    socket.on('leaveBoard', (boardId) => {
      if (boardId) socket.leave(`board:${boardId}`);
    });
  });

  return io;
}

function getIO() {
  if (!io) {
    throw new Error('Socket.io has not been initialized yet');
  }
  return io;
}

module.exports = { init, getIO };