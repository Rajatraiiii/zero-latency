import { WebSocketServer } from 'ws';
// Start the local WebSocket server on the requested port (or default 8080).
export async function startWebSocketServer({ port = 8080, onMessage } = {}) {
  // Bind all interfaces so phones on the same Wi-Fi can reach the desktop.
  const server = new WebSocketServer({ host: '0.0.0.0', port });

  server.on('connection', (socket) => {
    socket.send(JSON.stringify({ type: 'CONNECTED', message: 'Zero Latency desktop connected.' }));

    socket.on('message', (raw) => {
      try {
        const payload = JSON.parse(raw.toString());
        if (!['STACK_TRACE', 'VISUAL_BUG'].includes(payload.type)) {
          socket.send(JSON.stringify({ type: 'ERROR', message: 'Unsupported alert type.' }));
          return;
        }

        onMessage?.(payload, socket);
      } catch (err) {
        console.error('Invalid WebSocket payload:', err && err.message ? err.message : err);
        socket.send(JSON.stringify({ type: 'ERROR', message: 'Payload must be valid JSON.' }));
      }
    });
  });

  server.broadcast = (payload) => {
    const message = JSON.stringify(payload);
    server.clients.forEach((client) => {
      if (client.readyState === 1) client.send(message);
    });
  };

  return new Promise((resolve, reject) => {
    const handleError = (error) => {
      server.removeListener('listening', handleListening);
      reject(error);
    };
    const handleListening = () => {
      server.removeListener('error', handleError);
      console.log(`WebSocket server listening on ws://0.0.0.0:${port}`);
      server._boundPort = port;
      resolve(server);
    };

    server.once('error', handleError);
    server.once('listening', handleListening);
  });
}
