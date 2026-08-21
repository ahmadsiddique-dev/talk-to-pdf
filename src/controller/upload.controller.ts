import type { Request, Response } from 'express'
import { pdfQueue } from '../services/bullmq.service.js'



export const uploadFiles = (req: Request, res: Response) => {
    for (let file of req.files as Express.Multer.File[]) {
        const id = crypto.randomUUID();
        pdfQueue.add('processPDF', {
            filePath: file.path,
            fileName: file.originalname,
            batchId: id 
        });
    }

    res.json({ message: "Files uploaded successfully!" });
}