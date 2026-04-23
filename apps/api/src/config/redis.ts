import { createClient } from 'redis';

const redisClient = createClient({
  url: process.env.REDIS_URL,
  socket: {
    reconnectStrategy: (retries: number) => {
      if (retries > 30) return new Error('Redis: too many reconnect attempts');
      return Math.min(retries * 150, 3000);
    },
  },
});

redisClient.on('error', (err) => console.error('Redis error:', err));
redisClient.on('connect', () => console.log('Redis connected'));
redisClient.on('reconnecting', () => console.log('Redis reconnecting...'));

export const connectRedis = async () => {
  await redisClient.connect();
};

export default redisClient;
