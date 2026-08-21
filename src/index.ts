import express from "express";
import path from "path";
import {upload} from './services/multer.service.js'
import { uploadFiles } from './controller/upload.controller.js'

const app = express();
const PORT = process.env['PORT'] || 3000;

const __filename = import.meta.url;
const __dirname = path.dirname(__filename);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

app.get("/", (_, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.post("/upload", upload.array("files", 10), (req, res) => uploadFiles(req, res));

app.listen(Number(PORT) ,"0.0.0.0", () => {
    console.log(`Server is up and running on port ${PORT}`);
})