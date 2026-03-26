import http from 'http';
import { Server } from 'socket.io';
import app, { prisma } from './app';
import { setIO } from './socket';

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});
setIO(io);

// Socket.io basics
io.on('connection', (socket) => {
  console.log(`🔌 [SOCKET CONNECTED] ${socket.id}`);

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
      console.log(`👤 [SOCKET] ${socket.id} joined private room: user_${userId}`);
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

      console.log(`💬 [SOCKET] New message for project ${projectId} from user ${senderId}`);
      
      const msg = await prisma.message.create({
        data: { projectId, senderId, content },
        include: { sender: { select: { id: true, name: true } } }
      });
      
      io.to(`project_${projectId}`).emit('receive_message', msg);
    } catch (err) {
      console.error(`🔥 [SOCKET ERROR] send_message:`, err);
    }
  });

  socket.on('disconnect', () => {
    console.log(`🔌 [SOCKET DISCONNECTED] ${socket.id}`);
  });
});

const PORT = Number(process.env.PORT) || 3001;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 [SERVER] Running on http://localhost:${PORT}`);
});
