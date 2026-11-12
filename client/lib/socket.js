import { io } from 'socket.io-client';
import { api, SOCKET_URL, getToken, setToken } from './api';

export function connectSocket() {
  const socket = io(SOCKET_URL, {
    // function: har connect/reconnect pe latest token uthata hai
    auth: (cb) => cb({ token: getToken() }),
    transports: ['websocket', 'polling'],
  });

  // Token expire hua to server reject karta hai. Naya token lekar dobara connect karo (max 3 baar).
  let tries = 0;
  socket.on('connect', () => { tries = 0; });
  socket.on('connect_error', async (err) => {
    if (err.message !== 'unauthorized' || tries >= 3) return;
    tries++;
    try {
      const r = await api('/auth/refresh', { method: 'POST' });
      setToken(r.token);
      socket.connect();
    } catch {
      /* logged out, stay disconnected */
    }
  });

  return socket;
}