import { Mastra, OtelConfig } from "@mastra/core";
import { LibSQLStore } from "@mastra/libsql";
import { researchWorkflow } from "./workflows/researchWorkflow";
import { learningExtractionAgent } from "./agents/learningExtractionAgent";
import { evaluationAgent } from "./agents/evaluationAgent";
import { reportAgent } from "./agents/reportAgent";
import { researchAgent } from "./agents/researchAgent";
import { webSummarizationAgent } from "./agents/webSummarizationAgent";
import { developerAgent } from "./agents/developerAgent";
import { generateReportWorkflow } from "./workflows/generateReportWorkflow";
import { env } from "process";
import { MessageListInput } from "@mastra/core/agent/message-list";
import { getStorage } from "./memory";
import { Hono, HonoRequest } from "hono";
import authProvider from "./auth";
import { middleware } from "./auth/ias";
import { authMiddleware } from "./middleware/auth";
import { taskManagerAgent } from "./agents/taskManager";
// import { cdsAuthProvider } from './auth/cds-auth-provider';
// import { authenticationMiddleware, authorizationMiddleware } from '@mastra/core';

function parseHeaders(headerString: string): Record<string, string> {
  return headerString.split(",").reduce((acc, header) => {
    const [key, value] = header.split("=").map((s) => s.trim());
    if (key && value) {
      acc[key] = value;
    }
    return acc;
  }, {} as Record<string, string>);
}

const otelConfig: OtelConfig = {
  serviceName: env.OTEL_SERVICE_NAME || "mastra-agent",
  enabled: false, // Disabled due to deprecation and RangeError issues
  sampling: {
    type: "ratio",
    probability: 0.5,
  },
  export: {
    protocol: (env.OTEL_EXPORTER_OTLP_PROTOCOL as "grpc" | "http") || "grpc",
    type: "otlp",
    endpoint: `${
      env.OTEL_EXPORTER_OTLP_ENDPOINT || "http://localhost:4317"
    }/v1/traces`,
    // optional headers
    headers: parseHeaders(env.OTEL_EXPORTER_OTLP_HEADERS || ""),
  },
};
const app = new Hono();
// app.use('*', authenticationMiddleware as any);
// app.use('*', authorizationMiddleware as any);

export const mastra = new Mastra({
  telemetry: otelConfig,
  storage: getStorage("mastra"),
  agents: {
    taskManagerAgent,
    researchAgent,
    reportAgent,
    evaluationAgent,
    learningExtractionAgent,
    webSummarizationAgent,
    developerAgent,
  },

  workflows: { generateReportWorkflow, researchWorkflow },
  server: {
    build: {
      openAPIDocs: true,
      swaggerUI: true,
      apiReqLogs: true,
    },
    host: env.HOST || "0.0.0.0",
    port: env.PORT ? parseInt(env.PORT) : 4111,
    cors: {
      origin: (origin: string) => origin,
      credentials: true,
      allowMethods: ["*"],
      allowHeaders: ["*"],
      exposeHeaders: ["*"],
    },
    middleware: [middleware],
    // , authMiddleware],
    // experimental_auth: authProvider,
    apiRoutes: [
      {
        // serviceAdapter:  new ExperimentalEmptyAdapter(),
        path: "/api/agents/test/stream",
        requiresAuth: true,
        createHandler: async ({ mastra }) => {
          return async (c) => {
            const { messages } = await c.req.json<{
              messages: MessageListInput;
            }>();

            const stream = await mastra
              .getAgent("researchAgent")
              .stream(messages, {
                savePerStep: true,
                memory: {
                  resource: c.get("user")?.id || "default",
                  //tbd
                  thread: c.get("thread")?.id || "default",
                },
              });

            return stream;
          };
        },
        method: "POST",
      },

      {
        path: "/health",
        method: "GET",
        handler: async (c) => {
          return c.text("OK");
        },
      },

      // User info endpoint that uses CDS context
      {
        path: "/user/me",
        method: "GET",
        requiresAuth: true,
        handler: async (c) => {
          console.log("🔐 User info endpoint", c.get("user"));
          const user = c.get("user"); // From experimental_auth
          console.log("🔐 User info endpoint - User:", user);
          return c.json({
            id: user?.id,
            name:
              user?.attr?.name ||
              `${user?.attr?.given_name || ""} ${
                user?.attr?.family_name || ""
              }`.trim(),
            email: user?.attr?.email,
            tenant: user?.tenant,
            roles: user?.roles,
            attributes: user?.attr,
            timestamp: new Date().toISOString(),
            source: "mastra-cds-direct-auth",
          });
        },
      },

      // Protected chat endpoint that includes user context
    ],
  },
});
