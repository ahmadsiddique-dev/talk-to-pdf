import type { Request, Response } from 'express'
import { pdfQueue } from '../services/bullmq.service.js'

export async function uploadFiles (req: Request, res: Response) {
    const ids = [];

    for (let file of req.files as Express.Multer.File[]) {
        const id = crypto.randomUUID();
        const job = await pdfQueue.add('processPDF', {
            filePath: file.path,
            fileName: file.originalname,
            batchId: id 
        });
        ids.push({name: file.filename, id: job.id});
    }

    res.json({ message: "Files added for Processing!" , ids});
}