import {openai} from "@ai-sdk/openai";
import {
    streamText,
    UIMessage,
    convertToModelMessages,
} from "ai";
import llm from "@/lib/llm";
import {frontendTools} from "@assistant-ui/react-ai-sdk";
import {MastraClient} from "@mastra/client-js";

export async function POST(req: Request) {
    const {messages} = await req.json();
    const controller = new AbortController();

    const baseUrl = process.env.MASTRA_BASE_URL || "http://localhost:4361";
    const mastraClient = new MastraClient({
        baseUrl: baseUrl,
    });

    return await mastraClient.getAgent("researchAgent").streamVNext({
            messages: convertToModelMessages(messages),
         
        }
    );


    const result = streamText({
        model: llm("gpt-5"),
        messages: convertToModelMessages(messages),
    });


    return result.toUIMessageStreamResponse();
}
