import { MCPClient } from '@mastra/mcp';
import { env } from 'process';

// Function to get MCP server URL from various sources
function getMCPServerUrl(): string {
  // Check environment variable first
  if (env.MCP_SERVER_URL) {
    return env.MCP_SERVER_URL;
  }

  // Check VCAP_SERVICES for bound MCP service
  if (env.VCAP_SERVICES) {
    try {
      const services = JSON.parse(env.VCAP_SERVICES);
      const mcpService = services['mcp-server']?.[0] || services['user-provided']?.find((s: any) => s.name?.includes('mcp'));
      if (mcpService?.credentials?.url) {
        return mcpService.credentials.url;
      }
    } catch (error) {
      console.warn('Failed to parse VCAP_SERVICES for MCP URL:', error);
    }
  }

  // Check service binding file (Kubernetes)
  const bindingFile = "/bindings/mcp/credentials";
  try {
    const fs = require('fs');
    if (fs.existsSync(bindingFile)) {
      const binding = JSON.parse(fs.readFileSync(bindingFile, "utf8"));
      if (binding.url) {
        return binding.url;
      }
    }
  } catch (error) {
    console.warn('Failed to read MCP binding file:', error);
  }

  // Default fallback - for development
  console.log('Using default MCP server URL - configure MCP_SERVER_URL environment variable for production');
  return "http://localhost:3000/mcp";
}

export const mcpClient = new MCPClient({
  id: `mastra-mcp-${Date.now()}`, // Unique ID to prevent multiple initialization error
  servers: {
     tools: { 
      url: new URL(getMCPServerUrl()),
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
