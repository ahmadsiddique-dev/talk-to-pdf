import { Worker } from 'bullmq'
import fs from 'node:fs'
import { Redis } from 'ioredis'
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters'
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { PDFParse } from 'pdf-parse'
import { MongoDBAtlasVectorSearch } from "@langchain/mongodb"
import { MongoClient } from "mongodb"
import 'dotenv/config'

export const connection = new Redis({
    maxRetriesPerRequest: null,
    host: 'redis',
    port: 6379,
})

if (!process.env['OPENAI_API_KEY']) {
    console.error("OPENAI_API_KEY is not defined in the environment variables.");
    throw new Error("OPENAI_API_KEY is not defined in the environment variables.");
}

if (!process.env['MONGODB_ATLAS_URI']) {
    console.error("MONGODB_ATLAS_URI is not defined in the environment variables.");
    throw new Error("MONGODB_ATLAS_URI is not defined in the environment variables.");
}

if (!process.env['MONGODB_ATLAS_DB_NAME']) {
    console.error("MONGODB_ATLAS_DB_NAME is not defined in the environment variables.");
    throw new Error("MONGODB_ATLAS_DB_NAME is not defined in the environment variables.");
}

if (!process.env['MONGODB_ATLAS_COLLECTION_NAME']) {
    console.error("MONGODB_ATLAS_COLLECTION_NAME is not defined in the environment variables.");
    throw new Error("MONGODB_ATLAS_COLLECTION_NAME is not defined in the environment variables.");
}
const embeddings = new GoogleGenerativeAIEmbeddings({
    model: "gemini-embedding-2"
});

const worker = new Worker('pdfQueue', async (job) => {
    const path = job.data.filePath;
    console.log(`Processing file: ${path} with batchId: ${job.data.batchId}`);
    const textSplitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 200,
    });
    console.log(`Reading file content from: ${path}`);
    const pdfBuffer = fs.readFileSync(path, 'utf-8');
    const parser = new PDFParse({data: pdfBuffer});
    const pdfData = await parser.getText();
    const fileContent = pdfData.text;
    const chunks = await textSplitter.splitText(fileContent);
    console.log(`File content split into ${chunks.length} chunks.`);
    const client = new MongoClient(process.env['MONGODB_ATLAS_URI']!);
    const collection = client
        .db(process.env['MONGODB_ATLAS_DB_NAME'])
        .collection(process.env['MONGODB_ATLAS_COLLECTION_NAME'] as string);
    console.log(`Connected to MongoDB Atlas, using database: ${process.env['MONGODB_ATLAS_DB_NAME']} and collection: ${process.env['MONGODB_ATLAS_COLLECTION_NAME']}`);
    const vectorStore = new MongoDBAtlasVectorSearch(embeddings, {
        collection,
        indexName: "vector_index",
        textKey: "text",
        embeddingKey: "embedding",
    });
    console.log("******************************************")
    console.log(`Adding ${chunks.length} chunks to the vector store for file: ${job.data.fileName}`);
    console.log("******************************************")
    try {
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
    } catch (error) {
        if (error instanceof Error) {
            console.error(`Error adding documents to vector store: ${error.message}`);
        } else {
            console.error(`Unexpected error: ${error}`);
        }
    }
    console.log(`Added ${chunks.length} chunks to the vector store for file: ${job.data.fileName}`);

}, {
    connection: connection, limiter: {
        max: 10,
        duration: 10000
    }
})



