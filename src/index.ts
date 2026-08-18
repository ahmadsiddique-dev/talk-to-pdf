import express from "express";
import path from "path";

const app = express();
const PORT = process.env['PORT'] || 3000;

const __filename = import.meta.url;
const __dirname = path.dirname(__filename);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
    console.log(`Server is up and running on port ${PORT}`);
})