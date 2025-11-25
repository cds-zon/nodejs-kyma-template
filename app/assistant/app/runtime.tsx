"use client";

import {AssistantCloud, AssistantRuntimeProvider} from "@assistant-ui/react";
import {AssistantChatTransport, useChatRuntime} from "@assistant-ui/react-ai-sdk";
import { config } from "@/lib/config";
import { useDataStreamRuntime } from "@assistant-ui/react-data-stream";
import { Thread } from "@/components/assistant-ui/thread";

// const {token, userId, workspaceId}= await fetch(`${config.api.assistantBaseUrl}/api/auth/token`).then((r) =>r.json())
const cloud = new AssistantCloud({
    baseUrl: config.api.assistantBaseUrl,
    anonymous:true,
    // userId,
    // workspaceId
    authToken: () =>
        fetch("/api/auth/token", { method: "POST" }).then((r) =>
          r.json().then((data) => data.token)
        ),
 });
export  function RuntimeProvider({
                                      children,
                                  }: Readonly<{
    children: React.ReactNode;
}>) {

    const runtimeAssistantChat = useChatRuntime({
        transport: new AssistantChatTransport({
            api: config.api.researchAgent,
            credentials: 'include',
            headers: async () => {
                const { token, workspaceId , userId} = await fetch(`/api/auth/token`, {
                    method: 'GET',
                    credentials: 'include',
                }).then((r) => r.json());
                console.log('Fetched token for DataStreamRuntime:', token);
                return {
                    Authorization: `${token}`
                };
            }
        }),
        // cloud,
    });
    const runtime = useDataStreamRuntime({
        api: config.api.researchAgent,
        credentials: 'include',
        headers: async () => {
            const { token, workspaceId , userId} = await fetch(`/api/auth/token`, {
                method: 'GET',
                credentials: 'include',
            }).then((r) => r.json());
            console.log('Fetched token for DataStreamRuntime:', token);
            return {
                Authorization: `${token}`,
                'X-Workspace-ID': workspaceId,
                'X-User-ID': userId,
            };
        }
    });

    return (
        <AssistantRuntimeProvider runtime={runtimeAssistantChat} >
            {children}
        </AssistantRuntimeProvider>
    );
}