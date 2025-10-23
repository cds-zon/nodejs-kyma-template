/**
 * Configuration for the assistant app
 */

export const config = {
  // Authentication
  auth: {
    type: (process.env.NEXT_PUBLIC_AUTH_TYPE as 'dummy' | 'mock' | 'jwt' | 'ias') || 'mock',
    jwt: {
      secret: process.env.JWT_SECRET || 'default-secret',
      issuer: process.env.JWT_ISSUER || 'assistant-app',
      audience: process.env.JWT_AUDIENCE || 'assistant-api',
    },
    ias: {
      clientId: process.env.IAS_CLIENT_ID || 'ias-client',
      clientSecret: process.env.IAS_CLIENT_SECRET,
      iasUrl: process.env.IAS_URL || 'https://ias.example.com',
      redirectUri: process.env.IAS_REDIRECT_URI,
    },
  },
  
  // API endpoints
  api: {
    assistantBaseUrl: process.env.NEXT_PUBLIC_ASSISTANT_BASE_URL || 'http://localhost:3000',
    mastraBaseUrl: process.env.MASTRA_BASE_URL || 'http://localhost:4361',
    researchAgent: `${process.env.NEXT_PUBLIC_AGENTS_BASE_URL || 'http://localhost:4111'}/api/agents/researchAgent/stream`
  },
  
  // OpenAI
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
  },
} as const;
