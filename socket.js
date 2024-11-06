let io;

module.exports = {
  init: server => {
    io = require('socket.io')(server);
    return io;
  },
  getIO: () => {
    if (!io) {
      throw Error('socket.io not initialized!');
    }
    return io;
  },
};
