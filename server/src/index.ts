import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import http from 'http';
import { Server } from 'socket.io';

// Routes imports
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import projectRoutes from './routes/projects';
import logRoutes from './routes/logs';
import searchRoutes from './routes/search';

dotenv.config();

const app = express();
const server = http.createServer(app);
export const io = new Server(server, {
  cors: { origin: '*' }
});
export const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

// Main Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/search', searchRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', time: new Date() });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found or invalid API call' });
});

// Socket.io basics
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on('join_project_room', (projectId) => {
    socket.join(`project_${projectId}`);
    console.log(`User ${socket.id} joined room project_${projectId}`);
  });

  socket.on('send_message', async ({ projectId, senderId, content }) => {
    // In a real app we'd save to DB here
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
