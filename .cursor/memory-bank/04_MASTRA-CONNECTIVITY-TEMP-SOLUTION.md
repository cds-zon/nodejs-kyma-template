# Memory Bank - Mastra AI Connectivity Issue

This folder contains documentation and temporary solutions for the Mastra AI connectivity issue.

## Files

### Documentation
- `mastra-ai-connectivity-issue.md` - Complete issue analysis and troubleshooting history
- `README.md` - This file

### Temporary Solution Files
- `chart/templates/mastra-configmap.yaml` - ConfigMap template with correct .env values
- `chart/templates/mastra-pvc.yaml` - PVC template for storage files
- `deploy-mastra-fix.sh` - Deployment script

## Issue Summary
Mastra service cannot connect to `ai-core-proxy:3002` because the application reads wrong environment variable values (`localhost:3002` and `api-key`) instead of the correct Kubernetes environment variables.

## Temporary Solution
1. **Volume Mounts**: Added `additionalVolumes` to mastra deployment in `values.yaml`
2. **ConfigMap**: Created ConfigMap with correct .env values to override any internal configuration
3. **Storage**: Added PVC for persistent storage files

## Deployment
Run the deployment script to apply the temporary fix:
```bash
cd memory-bank
./deploy-mastra-fix.sh
```

## Verification
After deployment, verify the fix:
1. Check if .env file is mounted correctly
2. Check application logs for correct environment variable values
3. Test API functionality

## Next Steps
- Investigate Mastra CLI configuration mechanism
- Consider using ConfigMap approach like researcher pod
- Find root cause of environment variable override

## Status
🔍 **INVESTIGATING** - Temporary solution deployed, root cause still unknown
