# Mastra AI Connectivity Issue - Memory Bank

## Issue Summary
Mastra service in Kubernetes cannot connect to `ai-core-proxy:3002` despite having correct environment variables. The application reads wrong values (`localhost:3002` and `api-key`) instead of the correct Kubernetes environment variables.

## Root Cause Analysis

### Environment Variables Status
✅ **Container environment variables are CORRECT:**
- `OPENAI_BASE_URL=http://ai-core-proxy.kyma-system.svc.cluster.local:3002`
- `OPENAI_API_KEY=dummy-api-key`

❌ **Application reads WRONG values:**
- `OPENAI_BASE_URL: http://localhost:3002`
- `OPENAI_API_KEY: api-key`

### Key Findings

1. **Node.js can read environment variables correctly** - Direct Node.js scripts show correct values
2. **Mastra CLI overrides environment variables** - Even explicit env vars don't work
3. **Researcher pod works fine** - Uses ConfigMap with correct values
4. **No .env file in mastra pod** - We removed it, but issue persists
5. **Built code looks correct** - The compiled code has correct environment variable references

### Comparison with Working Researcher Pod

**Researcher Pod (Working):**
- Uses ConfigMap: `OPENAI_APIKEY=dummy-api-key` and `OPENAI_BASE_URL=http://ai-core-proxy:3002`
- Has `.env` file with wrong values, but ConfigMap overrides it
- Works correctly

**Mastra Pod (Not Working):**
- Uses direct environment variables: `OPENAI_API_KEY=dummy-api-key` and `OPENAI_BASE_URL=http://ai-core-proxy.kyma-system.svc.cluster.local:3002`
- No `.env` file (we removed it)
- Application still reads wrong values

## Tests Performed

### 1. Environment Variable Tests
```bash
# Direct Node.js test - WORKS
kubectl exec -n devspace <pod> -c mastra -- node -e "console.log(process.env.OPENAI_BASE_URL)"
# Result: http://ai-core-proxy.kyma-system.svc.cluster.local:3002 ✅

# Application logs - FAILS
# Result: http://localhost:3002 ❌
```

### 2. Explicit Environment Variable Test
```bash
# Set explicit env vars and run - STILL FAILS
OPENAI_BASE_URL=http://ai-core-proxy:3002 OPENAI_API_KEY=dummy-api-key pnpm dev
# Result: Application still reads localhost:3002 ❌
```

### 3. Build Cache Clearing
```bash
# Cleared .mastra/output directory - NO EFFECT
rm -rf /usr/src/app/.mastra/output
# Result: Issue persists ❌
```

### 4. Network Policy Investigation
- Initially suspected NetworkPolicy blocking egress
- Disabled NetworkPolicy - Not the issue
- Network connectivity works fine

### 5. Configuration File Investigation
- No `.env` file in container (removed)
- No mastra configuration files found
- Built code looks correct

## Current Status
- ✅ Environment variables are correct in container
- ✅ Node.js can read them correctly
- ✅ Network connectivity works
- ❌ Mastra CLI/application reads wrong values
- ❌ Issue persists despite all troubleshooting

## Suspected Causes
1. **Mastra CLI has internal configuration mechanism** that overrides environment variables
2. **Build process caches old values** somewhere we haven't found
3. **User permissions issue** with how Mastra CLI reads environment variables
4. **Mastra CLI reads from different source** than standard Node.js process.env

## Next Steps
1. Add volume mounts for storage files and temporary .env file
2. Investigate Mastra CLI configuration mechanism
3. Check if there's a mastra-specific configuration file
4. Consider using ConfigMap approach like researcher pod

## Temporary Solution
Mount storage files and create .env file with correct values to override any internal configuration.

## Date
September 25, 2025

## Status
🔍 **INVESTIGATING** - Issue persists despite extensive troubleshooting
