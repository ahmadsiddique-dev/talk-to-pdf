import { Worker } from 'bullmq'
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters'
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { parsePDF } from './services/parser.service.js'
import { MongoDBAtlasVectorSearch } from "@langchain/mongodb"
import 'dotenv/config'
import { collection } from './lib/Vector_DB_Client.js'
import { connection } from './lib/redis_connection.js'



const imp = [
    !process.env['OPENAI_API_KEY'],
    !process.env['MONGODB_ATLAS_URI'],
    !process.env['MONGODB_ATLAS_DB_NAME'],
    !process.env['MONGODB_ATLAS_COLLECTION_NAME']
]

export const embeddings = new GoogleGenerativeAIEmbeddings({
    model: "gemini-embedding-2"
});

const worker = new Worker('pdfQueue', async (job) => {

    try {
        // DOn't worry just checking before it fails because of .env
        if (imp.some((val) => val)) {
            throw new Error("Missing required environment variables.");
        }

        const path = job.data.filePath;

        // Making text splitter instance
        const textSplitter = new RecursiveCharacterTextSplitter({
            chunkSize: 1000,
            chunkOverlap: 200,
        });

        // Making chunks from our text and this text is comming from /services/parser.service.ts so check that out
        const chunks = await textSplitter.splitText(await parsePDF(path));

        await job.updateProgress(30)

        // Vector store for later enabling indexing in vector search and further more
        const vectorStore = new MongoDBAtlasVectorSearch(embeddings, {
            // This client is comming from /lib/verctor_DB_Client.ts 
            collection,
            indexName: "vector_index",
            textKey: "text",
            embeddingKey: "embedding",
        });

        await job.updateProgress(60)

        // Adding docs to vector store now
        await vectorStore.addDocuments(chunks.map((chunk) => {
            return {
                pageContent: chunk,
                metadata: {
                    batchId: job.data.batchId,
                    fileName: job.data.fileName,
                    chunkIndex: chunks.indexOf(chunk),
                }
            }
        }));

        await job.updateProgress(90)

        return 'Documents processed successfully.'
    } catch (error) {
        if (error === 'Invalid Root reference.') {
            console.log("Pleas upload text containing files.")
        }
        return error instanceof Error ? error.message : "Something went wrong."
    }                                                                                             

}, {
    connection: connection, limiter: {
        max: 10,
        duration: 10000
    }
})

worker.on("completed", (e) => {
    console.log(e.data)
})