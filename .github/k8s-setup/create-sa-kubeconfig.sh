#!/bin/bash

# Create Service Account Kubeconfig for GitHub Actions
# This script creates a kubeconfig file using the service account token

set -e

NAMESPACE="devspace"
SERVICE_ACCOUNT="github-actions-deployer"
SECRET_NAME="github-actions-deployer-token"

# Extract values from current cluster
CLUSTER_NAME=$(kubectl config current-context)
SERVER=$(kubectl config view --minify -o jsonpath='{.clusters[0].cluster.server}')
TOKEN=$(kubectl get secret $SECRET_NAME -n $NAMESPACE -o jsonpath='{.data.token}' | base64 --decode)
CA_DATA=$(kubectl get secret $SECRET_NAME -n $NAMESPACE -o jsonpath='{.data.ca\.crt}')

# Create the kubeconfig
cat > github-actions-kubeconfig.yaml << EOF
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
  name: $CLUSTER_NAME
current-context: $CLUSTER_NAME
users:
- name: $SERVICE_ACCOUNT
  user:
    token: $TOKEN
EOF

echo "✅ Service account kubeconfig created: github-actions-kubeconfig.yaml"
echo "🔧 Server: $SERVER"
echo "🔑 Token length: ${#TOKEN} characters"
echo "📁 Default namespace: $NAMESPACE"
echo ""
echo "To use this kubeconfig:"
echo "  export KUBECONFIG=\$(pwd)/github-actions-kubeconfig.yaml"
echo "  kubectl get pods"
echo ""
echo "To base64 encode for GitHub secrets:"
echo "  cat github-actions-kubeconfig.yaml | base64 -w 0"
