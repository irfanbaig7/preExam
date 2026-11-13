const http = require('http');
const env = require('./config/env');
const connectDB = require('./config/db');
const createApp = require('./app');
const socket = require('./services/socket');
const processor = require('./services/processor');
const cron = require('./services/cron');

async function main() {
  if (env.JWT_ACCESS_SECRET.startsWith('change-me') || env.JWT_ACCESS_SECRET.startsWith('dev-')) {
    console.warn('[warn] JWT secrets are still defaults. Change them in server/.env before deploying.');
  }
  await connectDB();

  const server = http.createServer(createApp());
  socket.init(server);
  processor.start();
  await processor.resumeStuck();
  cron.start();

  server.listen(env.PORT, () => {
    console.log(`[server] http://localhost:${env.PORT}`);
    console.log(`[server] AI: ${ env.aiEnabled ? env.AI_PROVIDER : 'fallback (no AI key)'} | cache: ${env.REDIS_URL ? 'redis' : 'memory'} | payments: ${env.razorpayEnabled ? 'razorpay' : 'demo'}`);
  });
}

main().catch((err) => {
  console.error('[fatal]', err.message);
  if (/ECONNREFUSED|ServerSelection/i.test(err.message)) {
    console.error('MongoDB is not reachable. Start MongoDB locally or put a MongoDB Atlas URL in server/.env (MONGO_URI).');
  }
  process.exit(1);
});
