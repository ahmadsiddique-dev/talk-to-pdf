import express from "express";
import path from "path";
import {upload} from './services/multer.service.js'
import { uploadFiles } from './controller/upload.controller.js'
import { pdfQueue } from './services/bullmq.service.js'
import { QueueEvents, type JobProgress } from 'bullmq'
import { connection } from './lib/redis_connection.js'

const app = express();
const PORT = process.env['PORT'] || 3000;
const queueEvent = new QueueEvents('pdfQueue', {
    connection: connection
})

const __filename = import.meta.url;
const __dirname = path.dirname(__filename);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

app.get("/", (_, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.post("/upload", upload.array("files", 10), (req, res) => uploadFiles(req, res));

app.get("/job/:jobId", async (req, res) => {
    const { jobId } = req.params;
    const job = await pdfQueue.getJob(jobId);

    if (!job) {
        res.status(404).json({ message: "Job not found" });
        return;
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const onProgress = ({jobId, data}: {jobId: string, data: JobProgress}) => {
        if (jobId === job.id) {
            res.write(`data: ${JSON.stringify({ progress: data, state: 'active', fileName: job.data.fileName })}\n\n`); 
        }
    };

    const onCompleted = ({ jobId: id }: { jobId: string }) => {
        if (id === jobId) {
            res.write(`data: ${JSON.stringify({ progress: 100, state: 'completed', "fileName": job.data.fileName })}\n\n`);
            cleanup();
            res.end();
        }
    };

    const cleanup = () => {
        queueEvent.off('progress', onProgress);
        queueEvent.off('completed', onCompleted);
    };

    queueEvent.on('progress', onProgress);
    queueEvent.on('completed', onCompleted);

    req.on('close', cleanup);
});

app.get('/chat', (_, res) => {
    res.sendFile(path.join(__dirname, "public", "chat.html"))
})
app.listen(Number(PORT) ,"0.0.0.0", () => {
    console.log(`Server is up and running on port ${PORT}`);
});