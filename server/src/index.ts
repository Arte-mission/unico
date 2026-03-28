import http from 'http';
import { Server } from 'socket.io';
import app from './app';
import { prisma } from './lib/prisma';
import { setIO } from './socket';

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});
setIO(io);

// Task 8: Socket Stability & Logging
io.on('connection', (socket) => {
  console.log(`🔌 [SOCKET] New connection: ${socket.id}`);

  // Join a general project room
  socket.on('join_project_room', (projectId) => {
    try {
      if (!projectId) return;
      socket.join(`project_${projectId}`);
      console.log(`🏠 [SOCKET] ${socket.id} joined room: project_${projectId}`);
    } catch (err) {
      console.error(`🔥 [SOCKET ERROR] join_project_room:`, err);
    }
  });

  // Join a private user room for targeted notifications
  socket.on('join_user_room', (userId) => {
    try {
      if (!userId) return;
      socket.join(`user_${userId}`);
      console.log(`👤 [SOCKET] ${socket.id} joined user room: user_${userId}`);
    } catch (err) {
      console.error(`🔥 [SOCKET ERROR] join_user_room:`, err);
    }
  });

  socket.on('send_message', async ({ projectId, senderId, content }) => {
    try {
      if (!projectId || !senderId || !content) {
        console.warn(`⚠️ [SOCKET] Invalid message payload from ${socket.id}`);
        return;
      }

      console.log(`💬 [SOCKET] Message: Project ${projectId} | User ${senderId}`);
      
      const msg = await prisma.message.create({
        data: { projectId, senderId, content },
        include: { sender: { select: { id: true, name: true } } }
      });
      
      io.to(`project_${projectId}`).emit('receive_message', msg);
    } catch (err: any) {
      console.error(`🔥 [SOCKET ERROR] send_message:`, err.message);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  socket.on('error', (err) => {
    console.error(`🔌 [SOCKET DEVICE ERROR] ${socket.id}:`, err);
  });

  socket.on('disconnect', (reason) => {
    console.log(`🔌 [SOCKET DISCONNECTED] ${socket.id} | Reason: ${reason}`);
  });
});

const PORT = Number(process.env.PORT) || 3001;

// Task 4: Startup Logging
server.listen(PORT, '0.0.0.0', () => {
  console.log('--------------------------------------------------');
  console.log(`🚀 [UNICO SERVER] Initialized successfully.`);
  console.log(`📡 Listening on: http://0.0.0.0:${PORT}`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
  console.log('--------------------------------------------------');
});

// Global rejection handler
process.on('unhandledRejection', (reason, promise) => {
  console.error('🚨 [FATAL] Unhandled Rejection at:', promise, 'reason:', reason);
});
