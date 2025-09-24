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


export const mastra = new Mastra({
  telemetry: otelConfig,

  storage: new LibSQLStore({
    url: env["ConnectionStrings__mastra-db"] || "file:./mastra.db",
  }),

  agents: {
    researchAgent,
    reportAgent,
    evaluationAgent,
    learningExtractionAgent,
    webSummarizationAgent,
  },
   workflows: { generateReportWorkflow, researchWorkflow },
   server: { 
    host: env.HOST || undefined,
    port: env.PORT ? parseInt(env.PORT) : undefined,
    cors: {
      origin: "*",
      allowMethods: ["*"],
      allowHeaders: ["*"]
    },
    apiRoutes: [
      {
        // serviceAdapter:  new ExperimentalEmptyAdapter(),
        path: "/chat",
        createHandler: async ({ mastra }) => { 
          return async c=> {
            const {messages} = await c.req.json< {messages:MessageListInput}>() ;
            const stream=await mastra.getAgent("researchAgent").streamVNext(messages,{
              format:"aisdk"
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
      }
    ]
  },


});
