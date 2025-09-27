import { IdentityService } from "@sap/xssec";
import cds from "@sap/cds";
import { jwtDecode } from "jwt-decode";
import axios from "axios";

var credentials = cds.env.requires.auth.credentials;
const authService = new IdentityService(credentials);
const arg= process.argv.slice(2)[0];
export class TokenService {
    constructor({
      apiUrl
    }= { }) {
      this.apiUrl = apiUrl|| arg ||
      "https://v1-approuter-devspace.c-127c9ef.stage.kyma.ondemand.com/";
      this.tokens = new Map();
    }
  
    async getToken(serviceName) {
      try {
        console.log(`🔐 Getting token for service: ${serviceName}`);
  
        // Check if we already have a valid token
        const cached = this.tokens.get(serviceName);
        if (cached && cached.expires_in > Date.now()) {
          console.log(`🔐 Using cached token for ${serviceName}`);
          return cached;
        }
  
        // In a real implementation, you would use xssec to get the token
        // For this demo, we'll simulate the token acquisition process
  
        // Simulate xssec token acquisition
        const token = await authService.fetchClientCredentialsToken({
          // resource: `urn:sap:identity:application:provider:name:${serviceName}`
          //TODO: get the audience from credentials
          audience: "1a977efc-688c-4888-bb3b-f850d2ab20d0", // Approuter client ID
        });
  
        // Cache the token (simulate 1 hour expiry)
        this.tokens.set(serviceName, token);
  
        console.log(
          `🔐 Token acquired for ${serviceName}: ${token.access_token.substring(0, 50)}...`
        );
        //print the token claims
        console.log(
          `🔐 Token claims: ${JSON.stringify(jwtDecode(token.access_token), null, 2)}`
        );
        return token;
      } catch (error) {
        console.error(`❌ Error getting token for ${serviceName}:`, error);
        throw error;
      }
    }
  
    async makeAuthenticatedRequest(serviceName, url, options = {}) {
      try {
        const { access_token } = await this.getToken(serviceName);
  
        const requestOptions = {
          ...options,
          headers: {
            "x-vcap-application-id": serviceName,
            "x-approuter-authorization": `Bearer ${access_token}`,
            Authorization: `Bearer ${access_token}`,
            Accept: "application/json",
            ...options.headers,
          },
        };
  
        console.log(`🔗 Making authenticated request to ${url}`);
        const response = await axios(url, requestOptions);
  
        console.log(`✅ Request successful: ${response.status}`);
        return response;
      } catch (error) {
        console.error(`❌ Authenticated request failed:`, error.message);
        throw error;
      }
    }
  
    async testUserService() {
      console.log("\n📡 Testing User Service with XSSEC Token...");
  
      try {
        // Test user endpoints
        const endpoints = [
          "/user-api/attributes",
          "/user-api/currentUser",
          "/auth/api/me",
        ];
  
        for (const endpoint of endpoints) {
          try {
            const response = await tokenService.makeAuthenticatedRequest(
              "user-api",
              `${this.apiUrl}${endpoint}`,
              { timeout: 10000 }
            );
  
            console.log(`   ✅ ${endpoint}: ${response.status}`);
            console.log(`   Data: ${JSON.stringify(response.data, null, 2)}`);
          } catch (error) {
            console.log(
              `   ⚠️  ${endpoint}: ${error.response?.status || error.message}`
            );
          }
        }
      } catch (error) {
        console.log(`   ❌ User service test failed: ${error.message}`);
      }
    }
  
    async testmastraService() {
      console.log("\n📡 Testing mastra Service with XSSEC Token...");
  
      try {
        // Test mastra endpoints
        const endpoints = ["/api/agents"];
  
        for (const endpoint of endpoints) {
          try {
            const response = await this.makeAuthenticatedRequest(
              "mastra-api",
              `${this.apiUrl}${endpoint}`,
              { timeout: 10000 }
            );
  
            console.log(`   ✅ ${endpoint}: ${response.status}`);
            console.log(`   Data: ${JSON.stringify(response.data, null, 2)}`);
          } catch (error) {
            console.log(
              `   ⚠️  ${endpoint}: ${error.response?.status || error.message}`
            );
          }
        }
  
        console.log("\n📋 Test 1: List available agents");
        const agentsResponse = await this.makeAuthenticatedRequest(  "mastra-api",`${this.apiUrl}/api/agents`);
        console.log(`✅ Agents listed: ${Object.keys(agentsResponse.data).length} agents found`);
        console.log(`📄 Available agents: ${Object.keys(agentsResponse.data).join(', ')}`);
  
        // Test 2: Create a thread
        console.log("\n📋 Test 2: Create memory thread");
        const threadData = {
          threadId: "test-thread-1",
          resourceId: "test-resource-1",
          title: "Memory Persistence Test Thread",
          metadata: {
            testType: "persistence",
            createdAt: new Date().toISOString()
          }
        };
  
        const threadResponse = await this.makeAuthenticatedRequest(
          "mastra-api",
          `${this.apiUrl}/api/memory/threads?agentId=researchAgent`,
          {
            method: "POST",
            data: threadData
          }
        );
        console.log(`✅ Thread created: ${threadResponse.status}`);
        console.log(`📄 Thread data: ${JSON.stringify(threadResponse.data, null, 2)}`);
  
        // Test 3: Save messages
        await messageSaveTest.bind(this)(threadResponse);
  
        // Test 4: Retrieve messages
        console.log("\n📋 Test 4: Retrieve saved messages");
        const retrieveResponse = await this.makeAuthenticatedRequest(
          "mastra-api",
          `${this.apiUrl}/api/memory/threads/${threadResponse.data.threadId}/messages?agentId=${this.testData.agentId}&limit=10`
        );
        // Test the stream/vnext endpoint with proper payload structure
        const streamResponse = await this.makeAuthenticatedRequest(
          "mastra-api",
          `${this.apiUrl}/api/agents/researchAgent/stream/vnext`,
          {
            timeout: 15000,
            method: "POST",
            body: {
              messages: [{ role: "user", content: "Hello, can you help me with a simple test?" }],
              runId: "test-research-" + Date.now(),
              threadId: "test-thread-" + Date.now(),
              resourceId: "test-resource",
              modelSettings: {
                temperature: 0.1,
                maxTokens: 100
              },
              runtimeContext: {}
            },
          }
        );
  
        console.log(
          `   ✅ /api/agents/researchAgent/stream/vnext: ${streamResponse.status} ${streamResponse.statusText}`
        );
        
        // For streaming responses, we need to handle them differently
        if (streamResponse.status === 200) {
          console.log(`   📡 Streaming response received successfully`);
          // Read the first few chunks to verify it's working
          const responseText = await streamResponse.text();
          console.log(`   📄 Response preview: ${responseText.substring(0, 200)}...`);
        }
       } catch (error) {
        console.log(`   ❌ mastra service test failed: ${error.message}`);
        if (error.response) {
          console.log(`   📊 Error status: ${error.response.status}`);
          console.log(`   📄 Error response: ${error.response.data}`);
        }
      }
  
      async function messageSaveTest( threadResponse) {
        console.log("\n📋 Test 3: Save test messages");
        const messagesData = {
          messages: [
            {
              id: `msg-1-${Date.now()}`,
              content: "Hello! This is a test message for memory persistence verification.",
              role: "user",
              type: "text",
              threadId: threadResponse.data.id,
              resourceId: threadResponse.data.resourceId,
              createdAt: new Date().toISOString()
            },
            {
              id: `msg-2-${Date.now()}`,
              content: "This is a response message that should be stored in memory.",
              role: "assistant",
              type: "text",
              threadId: threadResponse.data.id,
              resourceId: threadResponse.data.resourceId,
              createdAt: new Date().toISOString()
            }
          ]
        };
  
        const messagesResponse = await this.makeAuthenticatedRequest(
          "mastra-api",
          `${this.apiUrl}/api/memory/save-messages?agentId=researchAgent`,
          {
            method: "POST",
            data: messagesData
          }
        );
        console.log(`✅ Messages saved: ${messagesResponse.status}`);
      }
    }
  }
  
  export const tokenService = new TokenService();