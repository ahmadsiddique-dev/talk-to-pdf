import type { Request, Response } from 'express'
import Anthropic from '@anthropic-ai/sdk'
import 'dotenv/config'
import crypto from 'node:crypto'

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
        model: "claude-opus-5",
        max_tokens: 1000,
        messages: messages,
        stream: false
    })
    
    stream.on("text", (text) => {
        responseText += text;
        console.log(text);
    })

    await stream.finalMessage();
    
    messages.push({ role: "assistant", content: responseText });

    res.send({ message: messages, success: true })
}