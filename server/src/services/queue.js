// Small in-process job queue: concurrency limit + retries with exponential backoff.
// The enqueue/register interface is the same shape BullMQ uses, so it can be swapped later.
const handlers = new Map();
const pending = [];
let running = 0;
const CONCURRENCY = 2;
const MAX_RETRIES = 2;

function register(name, handler, { onFail } = {}) {
  handlers.set(name, { handler, onFail });
}

function enqueue(name, payload, attempt = 0) {
  pending.push({ name, payload, attempt });
  setImmediate(tick);
}

function tick() {
  while (running < CONCURRENCY && pending.length) {
    const job = pending.shift();
    running++;
    run(job).finally(() => { running--; tick(); });
  }
}

async function run(job) {
  const entry = handlers.get(job.name);
  if (!entry) return console.warn('[queue] no handler for', job.name);
  try {
    await entry.handler(job.payload);
  } catch (err) {
    if (job.attempt < MAX_RETRIES) {
      const delay = 1000 * 2 ** job.attempt;
      console.warn(`[queue] ${job.name} failed (${err.message}), retry in ${delay}ms`);
      setTimeout(() => enqueue(job.name, job.payload, job.attempt + 1), delay);
    } else {
      console.error(`[queue] ${job.name} gave up:`, err.message);
      if (entry.onFail) await entry.onFail(job.payload, err).catch(() => {});
    }
  }
}

const stats = () => ({ pending: pending.length, running });

module.exports = { register, enqueue, stats };
