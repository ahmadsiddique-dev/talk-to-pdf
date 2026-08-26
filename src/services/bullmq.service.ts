import { Queue } from 'bullmq';
import { connection } from '../lib/redis_connection.js'


export const pdfQueue = new Queue('pdfQueue', {
    connection: connection
})

