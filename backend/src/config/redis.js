const Redis = require('ioredis');

let redisClient = null;

function connectRedis() {
  if (redisClient) return redisClient;

  const url = process.env.REDIS_URL || 'redis://localhost:6379';

  redisClient = new Redis(url, {
    maxRetriesPerRequest: 5,
    retryStrategy(times) {
      const delay = Math.min(times * 100, 3000);
      return delay;
    },
    reconnectOnError(err) {
      const targetError = 'READONLY';
      if (err.message.includes(targetError)) {
        return true; // Reconnect on READONLY errors
      }
      return false;
    },
  });

  redisClient.on('connect', () => {
    console.log('⚡ Redis connected successfully');
  });

  redisClient.on('error', (err) => {
    console.warn('⚠️ Redis Connection Error:', err.message);
  });

  return redisClient;
}

function getRedis() {
  if (!redisClient) {
    return connectRedis();
  }
  return redisClient;
}

// Wrapper utility methods with fail-safe error handling
const redisUtils = {
  async setKey(key, value, expiryInSeconds) {
    try {
      const client = getRedis();
      if (expiryInSeconds) {
        await client.set(key, JSON.stringify(value), 'EX', expiryInSeconds);
      } else {
        await client.set(key, JSON.stringify(value));
      }
    } catch (err) {
      console.error(`Redis SET error for key ${key}:`, err.message);
    }
  },

  async getKey(key) {
    try {
      const client = getRedis();
      const data = await client.get(key);
      return data ? JSON.parse(data) : null;
    } catch (err) {
      console.error(`Redis GET error for key ${key}:`, err.message);
      return null;
    }
  },

  async deleteKey(key) {
    try {
      const client = getRedis();
      await client.del(key);
    } catch (err) {
      console.error(`Redis DEL error for key ${key}:`, err.message);
    }
  },
};

module.exports = { connectRedis, getRedis, redisUtils };
