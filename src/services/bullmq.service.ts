import { Queue } from 'bullmq';
import { connection } from '../worker.js'


export const pdfQueue = new Queue('pdfQueue', {
    connection: connection
})

