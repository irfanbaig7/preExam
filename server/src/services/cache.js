// Cache with two backends: Redis if REDIS_URL is set, otherwise an in-memory Map.
const env = require('../config/env');

let redis = null;
if (env.REDIS_URL) {
  try {
    const Redis = require('ioredis');
    redis = new Redis(env.REDIS_URL, { maxRetriesPerRequest: 1 });
    redis.on('error', (e) => console.warn('[cache] redis error:', e.message));
  } catch (e) {
    console.warn('[cache] could not start redis, using memory:', e.message);
  }
}

const mem = new Map();

async function get(key) {
  if (redis) {
    try {
      const v = await redis.get(key);
      return v ? JSON.parse(v) : null;
    } catch { return null; }
  }
  const hit = mem.get(key);
  if (!hit) return null;
  if (hit.exp < Date.now()) { mem.delete(key); return null; }
  return hit.v;
}

async function set(key, value, ttlSeconds = 300) {
  if (redis) {
    try { await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds); } catch { /* ignore */ }
    return;
  }
  mem.set(key, { v: value, exp: Date.now() + ttlSeconds * 1000 });
}

async function delPrefix(prefix) {
  if (redis) {
    try {
      const keys = await redis.keys(prefix + '*');
      if (keys.length) await redis.del(keys);
    } catch { /* ignore */ }
    return;
  }
  for (const k of mem.keys()) if (k.startsWith(prefix)) mem.delete(k);
}

// Return the cached value, or compute + store it
async function remember(key, ttlSeconds, compute) {
  const hit = await get(key);
  if (hit !== null) return hit;
  const value = await compute();
  await set(key, value, ttlSeconds);
  return value;
}

module.exports = { get, set, delPrefix, remember };
