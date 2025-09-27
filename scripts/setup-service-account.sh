#!/bin/bash

# Kubernetes Service Account Setup for GitHub Actions
# This script creates a service account with proper RBAC permissions for CI/CD deployments

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
NAMESPACE="devspace"
SERVICE_ACCOUNT="github-actions-deployer"
SECRET_NAME="github-actions-deployer-token"

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

show_help() {
    cat << EOF
Kubernetes Service Account Setup for GitHub Actions

This script creates a service account with proper RBAC permissions for CI/CD deployments.
It generates a kubeconfig file that can be used in GitHub Actions without OIDC authentication.

USAGE:
    $0 [OPTIONS]

OPTIONS:
    --namespace NS    Target namespace for service account (default: devspace)
    --name SA_NAME    Service account name (default: github-actions-deployer)
    --help, -h        Show this help message

EXAMPLES:
    # Create service account in default namespace (devspace)
    $0

    # Create service account in specific namespace
    $0 --namespace my-namespace

    # Create service account with custom name
    $0 --name my-deployer

WHAT IT CREATES:
    1. ServiceAccount in the specified namespace
    2. ClusterRole with deployment permissions
    3. ClusterRoleBinding to bind the service account
    4. Secret to hold the service account token
    5. Kubeconfig file for GitHub Actions

PREREQUISITES:
    - kubectl must be configured and connected to your cluster
    - You must have cluster admin permissions

EOF
}

check_prerequisites() {
    print_status "Checking prerequisites..."
    
    if ! command -v kubectl &> /dev/null; then
        print_error "kubectl is not installed or not in PATH"
        exit 1
    fi
    
    if ! kubectl cluster-info &> /dev/null; then
        print_error "kubectl cannot connect to cluster. Please check your kubeconfig"
        exit 1
    fi
    
    # Test cluster admin permissions
    if ! kubectl auth can-i create clusterroles &> /dev/null; then
        print_error "You need cluster admin permissions to create ClusterRoles"
        exit 1
    fi
    
    print_success "All prerequisites met"
}

create_service_account() {
    print_status "Creating service account and RBAC..."
    
    # Create namespace if it doesn't exist
    if ! kubectl get namespace $NAMESPACE &> /dev/null; then
        print_status "Creating namespace: $NAMESPACE"
        kubectl create namespace $NAMESPACE
    fi
    
    # Create the service account resources
    cat << EOF | kubectl apply -f -
---
# Service Account for GitHub Actions
apiVersion: v1
kind: ServiceAccount
metadata:
  name: $SERVICE_ACCOUNT
  namespace: $NAMESPACE
---
# ClusterRole with deployment permissions
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: $SERVICE_ACCOUNT
rules:
# Core API resources
- apiGroups: [""]
  resources: ["pods", "services", "endpoints", "persistentvolumeclaims", "events", "configmaps", "secrets"]
  verbs: ["create", "delete", "get", "list", "patch", "update", "watch"]
- apiGroups: [""]
  resources: ["namespaces"]
  verbs: ["get", "list", "watch"]
# Apps API resources
- apiGroups: ["apps"]
  resources: ["deployments", "daemonsets", "replicasets", "statefulsets"]
  verbs: ["create", "delete", "get", "list", "patch", "update", "watch"]
# Extensions API resources (for ingress, etc.)
- apiGroups: ["extensions", "networking.k8s.io"]
  resources: ["ingresses", "networkpolicies"]
  verbs: ["create", "delete", "get", "list", "patch", "update", "watch"]
# Batch API resources (for jobs, cronjobs)
- apiGroups: ["batch"]
  resources: ["jobs", "cronjobs"]
  verbs: ["create", "delete", "get", "list", "patch", "update", "watch"]
# Autoscaling API resources
- apiGroups: ["autoscaling"]
  resources: ["horizontalpodautoscalers"]
  verbs: ["create", "delete", "get", "list", "patch", "update", "watch"]
# Policy API resources
- apiGroups: ["policy"]
  resources: ["poddisruptionbudgets"]
  verbs: ["create", "delete", "get", "list", "patch", "update", "watch"]
# RBAC API resources (limited)
- apiGroups: ["rbac.authorization.k8s.io"]
  resources: ["roles", "rolebindings"]
  verbs: ["create", "delete", "get", "list", "patch", "update", "watch"]
# Custom Resource Definitions (if needed)
- apiGroups: ["apiextensions.k8s.io"]
  resources: ["customresourcedefinitions"]
  verbs: ["get", "list", "watch"]
# Metrics (for HPA)
- apiGroups: ["metrics.k8s.io"]
  resources: ["pods", "nodes"]
  verbs: ["get", "list"]
---
# ClusterRoleBinding to bind the service account to the role
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: $SERVICE_ACCOUNT
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: $SERVICE_ACCOUNT
subjects:
- kind: ServiceAccount
  name: $SERVICE_ACCOUNT
  namespace: $NAMESPACE
---
# Secret to hold the service account token
apiVersion: v1
kind: Secret
metadata:
  name: $SECRET_NAME
  namespace: $NAMESPACE
  annotations:
    kubernetes.io/service-account.name: $SERVICE_ACCOUNT
type: kubernetes.io/service-account-token
EOF

    print_success "Service account and RBAC created"
}

create_kubeconfig() {
    print_status "Creating kubeconfig for service account..."
    
    # Wait for token to be created
    print_status "Waiting for service account token..."
    local retries=0
    while [ $retries -lt 30 ]; do
        if kubectl get secret $SECRET_NAME -n $NAMESPACE &> /dev/null; then
            local token=$(kubectl get secret $SECRET_NAME -n $NAMESPACE -o jsonpath='{.data.token}' 2>/dev/null | base64 --decode)
            if [ -n "$token" ]; then
                break
            fi
        fi
        sleep 2
        retries=$((retries + 1))
    done
    
    if [ $retries -eq 30 ]; then
        print_error "Timeout waiting for service account token"
        exit 1
    fi
    
    # Extract values from current cluster
    local cluster_name=$(kubectl config current-context)
    local server=$(kubectl config view --minify -o jsonpath='{.clusters[0].cluster.server}')
    local token=$(kubectl get secret $SECRET_NAME -n $NAMESPACE -o jsonpath='{.data.token}' | base64 --decode)
    local ca_data=$(kubectl get secret $SECRET_NAME -n $NAMESPACE -o jsonpath='{.data.ca\.crt}')
    
    # Create the kubeconfig
    cat > github-actions-kubeconfig.yaml << EOF
apiVersion: v1
kind: Config
clusters:
- cluster:
    certificate-authority-data: $ca_data
    server: $server
  name: $cluster_name
contexts:
- context:
    cluster: $cluster_name
    namespace: $NAMESPACE
    user: $SERVICE_ACCOUNT
  name: $cluster_name
current-context: $cluster_name
users:
- name: $SERVICE_ACCOUNT
  user:
    token: $token
EOF

    print_success "Service account kubeconfig created: github-actions-kubeconfig.yaml"
    print_status "Server: $server"
    print_status "Token length: ${#token} characters"
    print_status "Default namespace: $NAMESPACE"
}

test_kubeconfig() {
    print_status "Testing service account kubeconfig..."
    
    if kubectl --kubeconfig=github-actions-kubeconfig.yaml get pods -n $NAMESPACE &> /dev/null; then
        print_success "Service account kubeconfig works correctly!"
        local pod_count=$(kubectl --kubeconfig=github-actions-kubeconfig.yaml get pods -n $NAMESPACE --no-headers | wc -l)
        print_status "Found $pod_count pods in namespace $NAMESPACE"
    else
        print_error "Service account kubeconfig test failed"
        exit 1
    fi
}

update_github_secret() {
    print_status "Updating GitHub KUBE_CONFIG secret..."
    
    if command -v gh &> /dev/null; then
        if cat github-actions-kubeconfig.yaml | base64 -w 0 | gh secret set KUBE_CONFIG; then
            print_success "GitHub KUBE_CONFIG secret updated with service account kubeconfig"
        else
            print_warning "Failed to update GitHub secret. You can do it manually:"
            print_status "  cat github-actions-kubeconfig.yaml | base64 -w 0 | gh secret set KUBE_CONFIG"
        fi
    else
        print_warning "GitHub CLI not found. Update the secret manually:"
        print_status "  cat github-actions-kubeconfig.yaml | base64 -w 0 | gh secret set KUBE_CONFIG"
    fi
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --namespace)
            NAMESPACE="$2"
            shift 2
            ;;
        --name)
            SERVICE_ACCOUNT="$2"
            SECRET_NAME="$2-token"
            shift 2
            ;;
        --help|-h)
            show_help
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Main execution
print_status "🔧 Kubernetes Service Account Setup for GitHub Actions"
print_status "====================================================="
print_status "Namespace: $NAMESPACE"
print_status "Service Account: $SERVICE_ACCOUNT"
print_status ""

check_prerequisites
create_service_account
create_kubeconfig
test_kubeconfig
update_github_secret

print_success "🎉 Setup complete!"
print_status ""
print_status "✅ Created:"
print_status "  • ServiceAccount: $SERVICE_ACCOUNT (namespace: $NAMESPACE)"
print_status "  • ClusterRole: $SERVICE_ACCOUNT"
print_status "  • ClusterRoleBinding: $SERVICE_ACCOUNT"
print_status "  • Secret: $SECRET_NAME"
print_status "  • Kubeconfig: github-actions-kubeconfig.yaml"
print_status ""
print_status "🚀 Your GitHub Actions can now deploy without OIDC authentication!"
print_status "The KUBE_CONFIG secret has been updated with the service account credentials."
