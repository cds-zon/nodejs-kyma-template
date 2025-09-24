import { MCPClient } from '@mastra/mcp';
import { env } from 'process';

export const mcpClient = new MCPClient({
  
  servers: {
     tools: { 
      url: new URL(env.MCP_SERVER_URL || "http://localhost:3000/mcp"),
      requestInit: {
        headers: env.MCP_DEFAULT_HEADERS
            ? JSON.parse(env.MCP_DEFAULT_HEADERS)
            : {
              "scai-agent-runtime": "mastra",
              "scai-agent-name": "mastra",
              "scai-agent-version": "1.0.0",
            }
      },
    }   
  },
});
 
export default mcpClient;
