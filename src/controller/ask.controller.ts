import type { Request, Response } from 'express'
import Anthropic, { } from '@anthropic-ai/sdk'
import 'dotenv/config'
import crypto from 'node:crypto'
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { tool } from '@langchain/core/tools';

export const embeddings = new GoogleGenerativeAIEmbeddings({
    model: "gemini-embedding-2"
});

export async function getData(search_string: string) {
    if (!search_string) {
        return 'No Args Provided'
    }

    return 'Hackclub is a non-profit organization which provides a plattform to teens to get togather build projects and enhance their skill with fun and friends. It\' really really cool community around the world.'
}  

export const tools: Anthropic.Tool[] = [
    {
        name: "get_data_tool",
        description: "Search the embedding store for relevant information from the user's documents. Use this when you need factual information that may exist in the user's stored documents.",
        input_schema: {
            type: "object",
            properties: {
                search_string: {
                    type: "string",
                    description: "A concise semantic search query for the embedding store."
                },
            },
            required: ['search_string'],
            additionalProperties: false
        },
        strict: true,
    }
]

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
        res.send({message: "Something went wrong!", success: false})
    }

    messages.push({role: "user", content: data.prompt})

    let responseText = '';

    const stream = await client.messages.stream({
        model: "claude-haiku-4-5",
        max_tokens: 1000,
        messages: messages,
        tools: tools
    })

    stream.on("text", (text) => {
        responseText += text;
        console.log(text);
    })

    // id: toolu_01DUUBAqsSUYksBk9fedhjeZ
    // rag | Name: get_data_tool
    // rag | ToolSetName: undefined
    // rag | caller { type: 'direct' }
    // rag | Input { search_string: 'Hack Club information overview' }
    // rag | type tool_use

    stream.on('contentBlock', async (e) => {
        if (e.type === 'tool_use') {
            console.log("id: ", e.id, "\nName: ", e.name, "\nToolSetName: ", e.toolset_name, "\ncaller", e.caller, "\nInput", e.input, '\ntype', e.type)

            if (e.name === 'get_data_tool') {
                const response = await getData("hello dear how are you")

                messages.push({role: "assistant", content: response})
                const finalStream = await client.messages.stream({
                    model: "claude-haiku-4-5",
                    max_tokens: 1000,
                    messages: messages,
                    tools: tools
                })

                finalStream.on("text", (text) => {
                    responseText += text
                })
            }
        }
        
        
    })

    await stream.finalMessage();
    
    messages.push({ role: "assistant", content: responseText });

    res.send({ message: messages, success: true })
}