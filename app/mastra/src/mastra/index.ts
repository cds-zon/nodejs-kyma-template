import {Mastra, OtelConfig} from '@mastra/core';
import { LibSQLStore } from '@mastra/libsql';
import { researchWorkflow } from './workflows/researchWorkflow';
import { learningExtractionAgent } from './agents/learningExtractionAgent';
import { evaluationAgent } from './agents/evaluationAgent';
import { reportAgent } from './agents/reportAgent';
import { researchAgent } from './agents/researchAgent';
import { webSummarizationAgent } from './agents/webSummarizationAgent';
import { generateReportWorkflow } from './workflows/generateReportWorkflow';
import { env } from 'process';
import {MessageListInput} from "@mastra/core/agent/message-list";
import { getStorage } from './memory';
import { cdsAuthProvider, MastraAuthCds } from './auth/cds-auth-provider';
import { Hono } from 'hono';
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
  enabled: true,
  sampling: {
    type: "ratio",
    probability: 0.5,
  },
  export: {
    protocol: env.OTEL_EXPORTER_OTLP_PROTOCOL as "grpc" | "http" || "grpc", 
    type: "otlp",
    endpoint: `${env.OTEL_EXPORTER_OTLP_ENDPOINT || "http://localhost:4317"}/v1/traces`,
    // optional headers
    headers:  parseHeaders(env.OTEL_EXPORTER_OTLP_HEADERS || ""),
  },
};
const app = new Hono();
// app.use('*', authenticationMiddleware as any);
// app.use('*', authorizationMiddleware as any);

export const mastra = new Mastra({
  telemetry: otelConfig, 
  storage: getStorage("mastra"), 
  agents: {
    researchAgent,
    reportAgent,
    evaluationAgent,
    learningExtractionAgent,
    webSummarizationAgent,
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
      origin: "*",
      allowMethods: ["*"],
      allowHeaders: ["*"]
    },
    experimental_auth: {
      name: "cds",
      protected: [
        "/*"
      ],
      authorizeUser: cdsAuthProvider.authorizeUser.bind(cdsAuthProvider),
      authenticateToken: cdsAuthProvider.authenticateToken.bind(cdsAuthProvider),
    },
    // middleware: [
    //   {
    //     path: "*",
    //     handler: async (c, next) => {
    //         console.log('before handler',{
    //           // authConfig: c.get('mastra').getServer()?.experimental_auth,
    //           customRouteAuthConfig: c.get('customRouteAuthConfig')?.[c.req.path],
    //           user:c.get('user'),
    //           runtimeContext: c.get('runtimeContext'),
    //         });
    //         c.get('customRouteAuthConfig')[c.req.path] = true;
    //         await next();

    //         console.log('after handler',{
    //           // mastra: c.get('mastra'),
    //           // authConfig: c.get('mastra').getServer()?.experimental_auth,
    //           customRouteAuthConfig: c.get('customRouteAuthConfig')?.[c.req.path],
    //           user:c.get('user'),
    //           runtimeContext: c.get('runtimeContext'),
    //         });
          
    //     }
        
    //   }
    // ],
    apiRoutes: [
      {
        // serviceAdapter:  new ExperimentalEmptyAdapter(),
        path: "/chat",
        createHandler: async ({ mastra }) => { 
          return async c=> {
            const {messages} = await c.req.json< {messages:MessageListInput}>() ;
            const stream=await mastra.getAgent("researchAgent").streamVNext(messages,{
              format:"aisdk",
              savePerStep:true,
              memory: {
                resource: c.req.header("X-Resource-Id") || "default",
                thread: c.req.header("X-Thread-Id") || "default",
               
              }
            });

            return stream.toUIMessageStreamResponse();
          }
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

      // User info endpoint that uses Mastra auth
      {
        path: "/user/me",
        method: "GET",
        requiresAuth: true,
        handler: async (c) => {
          return c.json({
            ...c.get('runtimeContext')?.get('user') ||{},
            timestamp: new Date().toISOString(),
            source: 'mastra-cds-auth-provider'
          });
        },
      },

      // Protected chat endpoint that includes user context
      {
        path: "/chat/protected",
        method: "POST",
        requiresAuth: true,
        handler: async (c) => {
          const user = c.get('user');
          const { messages } = await c.req.json<{ messages: MessageListInput }>();
          
          if (!messages) {
            return c.json({ error: 'Messages are required' }, 400);
          }

          try {
            // Include user context in the agent call
            const stream = await mastra.getAgent("researchAgent").streamVNext(messages, {
              format: "aisdk",
              savePerStep: true,
              memory: {
                resource: user?.id || "anonymous",
                thread: c.req.header("X-Thread-Id") || "default",
              }
            });

            return stream.toUIMessageStreamResponse();
          } catch (error) {
            console.error('Protected chat error:', error);
            return c.json({ error: 'Chat processing failed' }, 500);
          }
        },
      }
    ]
  },


});
