#!/bin/bash

# Create Service Account Kubeconfig for Workspace/DevContainer
# This script creates a kubeconfig file for local development and devcontainer use

set -e

NAMESPACE="${NAMESPACE:-devspace}"
SERVICE_ACCOUNT="${SERVICE_ACCOUNT:-workspace-developer}"
SECRET_NAME="${SECRET_NAME:-workspace-developer-token}"
OUTPUT_FILE="${OUTPUT_FILE:-workspace-kubeconfig.yaml}"

echo "🔧 Creating workspace kubeconfig..."
echo "   Namespace: $NAMESPACE"
echo "   Service Account: $SERVICE_ACCOUNT"
echo "   Secret: $SECRET_NAME"
echo ""

# Check if kubectl is available
if ! command -v kubectl &> /dev/null; then
    echo "❌ kubectl not found. Please install kubectl first."
    exit 1
fi

# Check if secret exists
if ! kubectl get secret $SECRET_NAME -n $NAMESPACE &> /dev/null; then
    echo "❌ Secret $SECRET_NAME not found in namespace $NAMESPACE"
    echo ""
    echo "To create the service account and secret, run:"
    echo "  kubectl apply -f .github/k8s-setup/workspace-sa.yaml"
    exit 1
fi

# Extract values from current cluster
CLUSTER_NAME=$(kubectl config current-context)
SERVER=$(kubectl config view --minify -o jsonpath='{.clusters[0].cluster.server}')
TOKEN=$(kubectl get secret $SECRET_NAME -n $NAMESPACE -o jsonpath='{.data.token}' | base64 --decode)
CA_DATA=$(kubectl get secret $SECRET_NAME -n $NAMESPACE -o jsonpath='{.data.ca\.crt}')

# Validate extracted values
if [ -z "$SERVER" ] || [ -z "$TOKEN" ] || [ -z "$CA_DATA" ]; then
    echo "❌ Failed to extract cluster information"
    echo "   Server: ${SERVER:-missing}"
    echo "   Token: ${TOKEN:+present}"
    echo "   CA Data: ${CA_DATA:+present}"
    exit 1
fi

# Create the kubeconfig
cat > "$OUTPUT_FILE" << EOF
apiVersion: v1
kind: Config
clusters:
- cluster:
    certificate-authority-data: $CA_DATA
    server: $SERVER
  name: $CLUSTER_NAME
contexts:
- context:
    cluster: $CLUSTER_NAME
    namespace: $NAMESPACE
    user: $SERVICE_ACCOUNT
  name: workspace-context
current-context: workspace-context
users:
- name: $SERVICE_ACCOUNT
  user:
    token: $TOKEN
EOF

echo "✅ Workspace kubeconfig created: $OUTPUT_FILE"
echo ""
echo "📊 Configuration details:"
echo "   🔧 Server: $SERVER"
echo "   🔑 Token length: ${#TOKEN} characters"
echo "   📁 Default namespace: $NAMESPACE"
echo "   📋 Context: workspace-context"
echo ""
echo "🚀 To use this kubeconfig:"
echo "   # For current session:"
echo "   export KUBECONFIG=\$(pwd)/$OUTPUT_FILE"
echo "   kubectl get pods"
echo ""
echo "   # For devcontainer (add to devcontainer.json):"
echo "   \"containerEnv\": {"
echo "     \"KUBECONFIG\": \"/workspace/$OUTPUT_FILE\""
echo "   }"
echo ""
echo "   # To merge with existing kubeconfig:"
echo "   KUBECONFIG=~/.kube/config:\$(pwd)/$OUTPUT_FILE kubectl config view --flatten > ~/.kube/config.new"
echo "   mv ~/.kube/config.new ~/.kube/config"
echo ""
echo "🔒 Security note: This file contains sensitive credentials."
echo "   Make sure it's in .gitignore!"

# Check if file is in gitignore
if [ -f .gitignore ]; then
    if ! grep -q "$OUTPUT_FILE" .gitignore; then
        echo ""
        echo "⚠️  Warning: $OUTPUT_FILE is not in .gitignore"
        echo "   Add it to prevent committing credentials:"
        echo "   echo '$OUTPUT_FILE' >> .gitignore"
    fi
fi

