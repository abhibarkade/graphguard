import Redis from 'ioredis';

let redis: Redis;

export const initRedis = (connectionString: string) => {
    if (redis) return;

    redis = new Redis(connectionString, {
        maxRetriesPerRequest: null
    });

    redis.on('error', (err) => {
        console.error('Redis Client Error', err);
    });

    redis.on('connect', () => {
        // console.log('Redis connected');
    });
};

export const getRedis = () => {
    if (!redis) {
        throw new Error('Redis not initialized');
    }
    return redis;
};

export const closeRedis = async () => {
    if (redis) {
        await redis.quit();
    }
}
