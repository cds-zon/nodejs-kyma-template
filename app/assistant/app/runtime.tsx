"use client";

import {AssistantCloud, AssistantRuntimeProvider} from "@assistant-ui/react";
import {AssistantChatTransport, useChatRuntime} from "@assistant-ui/react-ai-sdk";

const cloud = new AssistantCloud({
    baseUrl: process.env["NEXT_PUBLIC_ASSISTANT_BASE_URL"]! || "http://localhost:4361/api/agents/reaserchAgent/stream/vnext",
    async authToken   ()   {
        return  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWUsImlhdCI6MTUxNjIzOTAyMiwiZXhwIjo5MDE2MjM5MDIyfQ.Ph_TolN_X-h1A3aZk2UXdfkn-jBwsI3fNrbISr0KLV8";
    } 
            
});

export function RuntimeProvider({
                                      children,
                                  }: Readonly<{
    children: React.ReactNode;
}>) {

    const runtimeAssistantChat = useChatRuntime({
        transport: new AssistantChatTransport({
            api: process.env["NEXT_PUBLIC_ASSISTANT_BASE_URL"]! || "http://localhost:4361/chat"
         })
    });
   
    return (
        <AssistantRuntimeProvider runtime={runtimeAssistantChat} >
            {children}
        </AssistantRuntimeProvider>
    );
}