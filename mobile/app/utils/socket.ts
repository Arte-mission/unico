import { io } from 'socket.io-client';

// Assuming running locally on port 3000 or using an ngrok URL.
// IMPORTANT: For Android Emulator, use http://10.0.2.2:3000
// For iOS Simulator, use http://localhost:3000
const SOCKET_URL = 'http://localhost:3000';

export const socket = io(SOCKET_URL, {
  transports: ['websocket'],
  autoConnect: true,
});
