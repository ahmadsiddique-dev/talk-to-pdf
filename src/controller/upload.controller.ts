import type { Request, Response } from 'express'
import { pdfQueue } from '../services/bullmq.service.js'

const id = crypto.randomUUID();

export const uploadFiles = (req: Request, res: Response) => {
    for (let file of req.files as Express.Multer.File[]) {
        pdfQueue.add('processPDF', {
            filePath: file.path,
            fileName: file.originalname,
            batchId: id 
        });
    }

    res.json({ message: "Files uploaded successfully!" });
}