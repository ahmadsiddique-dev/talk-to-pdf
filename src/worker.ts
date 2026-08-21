import { Worker } from 'bullmq'
import { Redis } from 'ioredis'

export const connection = new Redis({
    maxRetriesPerRequest: null,
    host: 'redis',
    port: 6379,
})

const worker = new Worker('pdfQueue', async (job) => {
    
}, { connection: connection, limiter: {
    max: 10,
    duration: 10000
} })



