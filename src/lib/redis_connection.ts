import { Redis } from 'ioredis'

export const connection = new Redis({
    maxRetriesPerRequest: null,
    host: 'redis',
    port: 6379,
})