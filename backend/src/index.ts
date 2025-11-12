import http from 'http';
import { Server as SocketServer } from 'socket.io';
import { bootstrap } from './app.js';
import { setupSocket } from './socket/chat.js';

const startServer = async (): Promise<void> => {
  const app = await bootstrap();
  const server = http.createServer(app);

  // Setup Socket.io
  const io = new SocketServer(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  setupSocket(io);

  const PORT = process.env.PORT || 3000;
  server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
};

startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});






