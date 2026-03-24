import { io } from 'socket.io-client';

// Assuming running locally on port 3000 or using an ngrok URL.
// IMPORTANT: For Android Emulator, use http://10.126.167.233:3000
// For iOS Simulator, use http://10.126.167.233:3001
const SOCKET_URL = 'http://10.126.167.233:3001';

export const socket = io(SOCKET_URL, {
  transports: ['websocket'],
  autoConnect: true,
});
