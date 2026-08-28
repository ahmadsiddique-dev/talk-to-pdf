import type { Request, Response } from 'express'
import Anthropic from '@anthropic-ai/sdk'
import 'dotenv/config'
import crypto from 'node:crypto'
import * as z from "zod";
import { betaZodTool } from '@anthropic-ai/sdk/helpers/beta/zod.js';
import { vectorStore } from '../worker.js';

export async function getData(search_string: string) {
    if (!search_string) {
        return 'No Args Provided'
    }

    return 'Hackclub is a non-profit organization which provides a plattform to teens to get togather build projects and enhance their skill with fun and friends. It\' really really cool community around the world.'
}

export const fetchInfoTool = betaZodTool({
    name: "get_data",
    description: "Search the embedding store for relevant information from the user's documents. Use this when you need factual information that may exist in the user's stored documents.",
    inputSchema: z.object({
        search_string: z.string().describe("A concise semantic search query for the embedding store.")
    }),
    run: async (input): Promise<any> => {
        let searchResult;
        try {
            searchResult = await vectorStore.similaritySearch(input.search_string, 4)
        } catch (error) {
            console.log(error instanceof Error ? error.message : "Something went wrong")
        }
        if (!searchResult || searchResult.length === 0) {
            return "No relevant information found in stored documents.";
        }

        return searchResult.map(doc => doc.pageContent + "\nFileName: " + doc.metadata['fileName']).join("\n\n---\n\n");
    }
})

const client = new Anthropic();
const chatId = crypto.randomUUID();
const messages: {
    role: "user" | "assistant";
    content: string;
}[] = [];
const messagesMap = new Map<string, {
    role: "user" | "assistant";
    content: string;
}[]>();
messagesMap.set(chatId, messages);

export async function Ask(req: Request, res: Response) {
    const data = await req.body;

    if (!data.prompt) {
        res.send({ message: "Something went wrong!", success: false })
    }

    messages.push({ role: "user", content: data.prompt })

    let responseText = '';

    const stream = client.beta.messages.toolRunner({
        model: "claude-haiku-4-5",
        max_tokens: 4000,
        system: "You are a chatbot which gives results to the user based on his upload documents. You fetch the documents from database using tool and give answer and if you don't know answer just ask: Sorry, I don't know ",
        messages: [{ role: "user", content: data.prompt }],
        tools: [fetchInfoTool],
        stream: true
    });

    for await (const chunk of (await stream).content) {
        if (chunk.type === 'text') {
            console.log(chunk.text)
            if (chunk.citations) {
                console.log("Citation: ", chunk.citations)
            }
            responseText += chunk.text;
        }
    }

    messages.push({ role: "assistant", content: responseText });

    res.send({ message: messages, success: true })
}