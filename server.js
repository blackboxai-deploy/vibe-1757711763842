const { createServer } = require('http');
const { Server } = require('socket.io');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const nextApp = next({ dev });
const handle = nextApp.getRequestHandler();

// In-memory storage for simplicity (in production, use Redis or database)
const rooms = new Map();
const gameStates = new Map();

nextApp.prepare().then(() => {
  const server = createServer((req, res) => {
    handle(req, res);
  });

  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Join room
    socket.on('join-room', ({ roomId, player }) => {
      socket.join(roomId);
      socket.roomId = roomId;
      socket.playerId = player.id;
      
      // Broadcast to room that player joined
      socket.to(roomId).emit('player-joined', player);
      
      // Send current game state to the joining player
      const gameState = gameStates.get(roomId);
      if (gameState) {
        socket.emit('game-state', {
          type: 'GAME_STATE_UPDATE',
          payload: gameState
        });
      }
      
      console.log(`Player ${player.name} joined room ${roomId}`);
    });

    // Leave room
    socket.on('leave-room', ({ roomId, playerId }) => {
      socket.leave(roomId);
      
      // Broadcast to room that player left
      socket.to(roomId).emit('player-left', { playerId });
      
      console.log(`Player ${playerId} left room ${roomId}`);
    });

    // Handle dice roll
    socket.on('dice-rolled', ({ roomId, diceRoll, gameState }) => {
      gameStates.set(roomId, gameState);
      
      // Broadcast dice roll to all players in room
      io.to(roomId).emit('dice-rolled', {
        type: 'DICE_ROLLED',
        payload: diceRoll
      });
      
      // Broadcast updated game state
      io.to(roomId).emit('game-state', {
        type: 'GAME_STATE_UPDATE',
        payload: gameState
      });
    });

    // Handle token move
    socket.on('token-moved', ({ roomId, move, gameState }) => {
      gameStates.set(roomId, gameState);
      
      // Broadcast move to all players in room
      io.to(roomId).emit('token-moved', {
        type: 'TOKEN_MOVED',
        payload: move
      });
      
      // Broadcast updated game state
      io.to(roomId).emit('game-state', {
        type: 'GAME_STATE_UPDATE',
        payload: gameState
      });
    });

    // Handle game finished
    socket.on('game-finished', ({ roomId, winner }) => {
      // Broadcast game finished to all players in room
      io.to(roomId).emit('game-finished', {
        type: 'GAME_FINISHED',
        payload: { winner }
      });
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
      
      if (socket.roomId && socket.playerId) {
        // Notify room that player disconnected
        socket.to(socket.roomId).emit('player-disconnected', {
          playerId: socket.playerId
        });
      }
    });

    // Handle errors
    socket.on('error', (error) => {
      console.error('Socket error:', error);
      socket.emit('error', {
        type: 'ERROR',
        payload: { message: 'An error occurred' }
      });
    });
  });

  const PORT = process.env.PORT || 3000;
  
  server.listen(PORT, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://localhost:${PORT}`);
    console.log('> Socket.IO server is running');
  });
});