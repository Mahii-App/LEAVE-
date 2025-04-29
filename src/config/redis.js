
const { createClient } = require('redis');
const logger = require('../utils/logger');

const redisClient = createClient({ url: process.env.REDIS_URL });
redisClient.on('connect', () => logger.info('Redis connected'));

redisClient.on('error', (err) => logger.error('Redis Client Error', err));

(async () => {
  await redisClient.connect();
  logger.info('Redis connected');
})();

module.exports = redisClient;