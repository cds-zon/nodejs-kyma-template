#!/bin/bash

# Deploy Mastra AI Connectivity Fix
# This script deploys the temporary solution for the Mastra AI connectivity issue

echo "🔧 Deploying Mastra AI Connectivity Fix..."

# Rebuild and deploy the updated chart (includes ConfigMap and PVC creation)
echo "🏗️  Rebuilding Helm chart..."
npm run build

# Deploy the updated chart (creates ConfigMap, PVC, and mounts volumes)
echo "🚀 Deploying updated chart..."
helm upgrade v1 ./gen/chart -n devspace

echo "✅ Deployment complete!"
echo ""
echo "📋 Next steps:"
echo "1. Check if the .env file is mounted correctly:"
echo "   kubectl exec -n devspace \$(kubectl get pods -n devspace -l app.kubernetes.io/name=mastra -o jsonpath='{.items[0].metadata.name}') -c mastra -- cat /usr/src/app/.env"
echo ""
echo "2. Check if the application now reads the correct values:"
echo "   kubectl logs -n devspace \$(kubectl get pods -n devspace -l app.kubernetes.io/name=mastra -o jsonpath='{.items[0].metadata.name}') -c mastra --tail=20"
echo ""
echo "3. Test the API:"
echo "   npm run test:auth"
echo ""
echo "📚 See memory-bank/mastra-ai-connectivity-issue.md for full issue documentation"
