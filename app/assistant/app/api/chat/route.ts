import {withBackendAuth, AuthenticatedRequest} from "@/lib/auth/backend-middleware";
import {openai} from "@ai-sdk/openai";
import {
    streamText,
    UIMessage,
    convertToModelMessages,
} from "ai";
import llm from "@/lib/llm";
import {frontendTools} from "@assistant-ui/react-ai-sdk";
import {MastraClient} from "@mastra/client-js";
import {toLanguageModelMessages} from "@assistant-ui/react-data-stream";
import {DataStreamEncoder, createAssistantStream, DataStreamDecoder} from "assistant-stream";
import {AssistantStream} from "assistant-stream";
import {createAssistantStreamResponse} from "assistant-stream";

async function handleChat(req: AuthenticatedRequest) {

    // Get auth token from request context (set by middleware)
    // const token = req.authToken;
    // const user = req.user;
    const abortController = new AbortController();

    const baseUrl = process.env.AGENTS_BASE_URL || "http://localhost:4361";
    const mastraClient = new MastraClient({
        baseUrl: baseUrl,
        headers: req.headers.has("authorization")
            ? {"authorization": req.headers.get("authorization")!}
            : {},
        abortSignal: abortController.signal,
        credentials: 'include',
        retries: 1
    });

    const {messages} = await req.json();
    const languageModelMessages = toLanguageModelMessages(messages, {
        unstable_includeId: true, // Include message IDs
    });

    console.log("Chat messages:", messages);
    // const stream= await mastraClient.getAgent("researchAgent").streamVNext({
    //         messages: convertToModelMessages(messages),
    //     }
    // );

    const stream = await mastraClient.getAgent("researchAgent").stream({
        resourceId: req.user?.id || "default",
        threadId: req.headers.get("x-thread-id") || "default",
        savePerStep: true,
        messages: languageModelMessages,

    })

    // return  stream;
    return createAssistantStreamResponse(async (controller) => {
        if (!stream.body) {
            controller.appendText("missing stream body");
            return;
        }
        const reader = stream.body.getReader();
        const decoder = new TextDecoder();
        let chunk = await reader.read();
        while (!chunk.done) {
            const text = decoder.decode(chunk.value);
            controller.appendText(text);
            chunk = await reader.read();
        }

    });


    // const result = streamText({
    //     model: llm("gpt-5"),
    //     messages: convertToModelMessages(messages),
    // });
    //
    //
    // return result.toUIMessageStreamResponse();
}

export const POST = withBackendAuth(handleChat);
