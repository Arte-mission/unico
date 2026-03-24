import { io } from 'socket.io-client';
import { SOCKET_URL } from './constants';

export const socket = io(SOCKET_URL, {
  transports: ['websocket'],
  autoConnect: true,
});

socket.on('connect', () => {
  console.log('Connected to socket server');
});

socket.on('connect_error', (err) => {
  console.log('Socket connection error:', err.message);
});
