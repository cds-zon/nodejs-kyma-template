# Mastra AI Service Environment Variable Override Issue Resolution

## Issue Summary
Mastra service in Kubernetes was trying to connect to `localhost:3002` instead of `ai-core-proxy:3002`, causing AI API connection failures with error:
```
Error creating stream APICallError [AI_APICallError]: Cannot connect to API
url: 'http://localhost:3002/v1/chat/completions?api-version=2024-06-01-preview'
```

## Root Cause Analysis
The `.env` file in `/usr/src/app/.env` was overriding Kubernetes environment variables:

**Before (problematic .env file):**
```
OPENAI_API_KEY="api-key"
EXA_API_KEY=""
OPENAI_BASE_URL=http://localhost:3002
```

**Kubernetes environment variables (correct):**
```
OPENAI_BASE_URL=http://ai-core-proxy.kyma-system.svc.cluster.local:3002
OPENAI_API_KEY=dummy-api-key
```

## Solution
Updated the `.env` file to match Kubernetes environment variables:
```
OPENAI_API_KEY="dummy-api-key"
EXA_API_KEY=""
OPENAI_BASE_URL=http://ai-core-proxy:3002
```

## Debugging Process

### 1. Initial Investigation
- Checked Kubernetes environment variables: ✅ Correct
- Tested network connectivity: ✅ Working
- Disabled NetworkPolicy: ❌ Not the issue

### 2. Added Debug Logging
Modified `/usr/src/app/src/mastra/llm.ts` to add extensive logging:
```typescript
console.log("=== LLM Configuration Debug ===");
console.log("Environment variables check:");
console.log("OPENAI_BASE_URL:", process.env.OPENAI_BASE_URL);
console.log("OPENAI_API_KEY:", process.env.OPENAI_API_KEY);
```

### 3. Discovered the Override
Debug output showed:
- Container env vars: `OPENAI_BASE_URL=http://ai-core-proxy.kyma-system.svc.cluster.local:3002`
- Application reading: `OPENAI_BASE_URL: http://localhost:3002`

This revealed the `.env` file was overriding Kubernetes environment variables.

### 4. Fixed the Configuration
Updated `.env` file and restarted the service.

## Key Lessons Learned

1. **Always check for `.env` files** that might override Kubernetes environment variables
2. **Use debug logging** to see what values the application actually receives at runtime
3. **Don't assume the issue is with Kubernetes configuration** - check application-level overrides first
4. **Environment variable precedence**: `.env` files can override container environment variables
5. **NetworkPolicy was not the issue** - we initially disabled it but the real fix was the .env file

## Verification
After the fix:
- ✅ Authentication working with XSSEC tokens
- ✅ API endpoints responding correctly  
- ✅ AI connectivity to `ai-core-proxy:3002` successful
- ✅ Streaming responses working
- ✅ Agent tools functioning properly

## Commands Used
```bash
# Check environment variables in container
kubectl exec -n devspace <pod-name> -c mastra -- env | grep OPENAI

# Update .env file in running container
kubectl exec -n devspace <pod-name> -c mastra -- bash -c 'cat > /usr/src/app/.env << "EOF"
OPENAI_API_KEY="dummy-api-key"
EXA_API_KEY=""
OPENAI_BASE_URL=http://ai-core-proxy:3002
EOF'

# Trigger service restart
kubectl exec -n devspace <pod-name> -c mastra -- touch /usr/src/app/.env

# Test API functionality
npm run test:auth
```

## Date
September 25, 2025

## Status
✅ **RESOLVED** - Mastra service now fully functional with proper AI connectivity
