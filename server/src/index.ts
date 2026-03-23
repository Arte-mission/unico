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
  console.log(`User connected: ${socket.id}`);

  socket.on('join_project_room', (projectId) => {
    socket.join(`project_${projectId}`);
    console.log(`User ${socket.id} joined room project_${projectId}`);
  });

  socket.on('send_message', async ({ projectId, senderId, content }) => {
    try {
      const msg = await prisma.message.create({
        data: { projectId, senderId, content },
        include: { sender: { select: { id: true, name: true } } }
      });
      io.to(`project_${projectId}`).emit('receive_message', msg);
    } catch (e) {
      console.error('Message error', e);
    }
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
