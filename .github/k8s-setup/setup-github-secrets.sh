#!/bin/bash

# GitHub Secrets and Variables Setup Script
# This script sets up Docker and Kubernetes credentials for GitHub Actions
# Usage: ./setup-github-secrets.sh [--org ORG_NAME | --repo] [--help]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
SCOPE=""
ORG_NAME=""
DOCKER_REGISTRY="scai-dev.common.repositories.cloud.sap"
DOCKER_USERNAME="reposscai"

# Function to print colored output
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

# Function to show help
show_help() {
    cat << EOF
GitHub Secrets and Variables Setup Script

This script sets up Docker and Kubernetes credentials for GitHub Actions workflows.
It extracts Docker credentials from your current Kubernetes cluster and sets up:
- DOCKER_REGISTRY (variable)
- DOCKER_USERNAME (variable) 
- DOCKER_PASSWORD (secret)
- KUBE_CONFIG (secret)

USAGE:
    $0 [OPTIONS]

OPTIONS:
    --org ORG_NAME    Set secrets/variables at organization level for ORG_NAME
    --repo            Set secrets/variables at repository level (default)
    --help, -h        Show this help message

EXAMPLES:
    # Set up for current repository
    $0 --repo

    # Set up for organization 'my-org'
    $0 --org my-org

    # Set up for current repository (default behavior)
    $0

PREREQUISITES:
    - kubectl must be configured and connected to your cluster
    - gh CLI must be installed and authenticated
    - For organization setup: GitHub account must have admin:org scope
    - For repository setup: GitHub account must have repo scope

EOF
}

# Function to check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    # Check if kubectl is available and configured
    if ! command -v kubectl &> /dev/null; then
        print_error "kubectl is not installed or not in PATH"
        exit 1
    fi
    
    # Check if kubectl can connect to cluster
    if ! kubectl cluster-info &> /dev/null; then
        print_error "kubectl cannot connect to cluster. Please check your kubeconfig"
        exit 1
    fi
    
    # Check if gh CLI is available
    if ! command -v gh &> /dev/null; then
        print_error "GitHub CLI (gh) is not installed or not in PATH"
        exit 1
    fi
    
    # Check if gh CLI is authenticated
    # if ! gh auth status &> /dev/null; then
    #     print_error "GitHub CLI is not authenticated. Run 'gh auth login' first"
    #     exit 1
    # fi
    
    print_success "All prerequisites met"
}

# Function to extract Docker credentials from Kubernetes
extract_docker_credentials() {
    print_status "Extracting Docker credentials from Kubernetes cluster..."
    
    # Find Docker registry secrets
    local docker_secrets=$(kubectl get secrets --all-namespaces -o json | jq -r '.items[] | select(.type == "kubernetes.io/dockerconfigjson") | "\(.metadata.namespace)/\(.metadata.name)"' | head -5)
    
    if [ -z "$docker_secrets" ]; then
        print_error "No Docker registry secrets found in cluster"
        exit 1
    fi
    
    print_status "Found Docker secrets:"
    echo "$docker_secrets"
    
    # Use the first available Docker secret
    local first_secret=$(echo "$docker_secrets" | head -1)
    local namespace=$(echo "$first_secret" | cut -d'/' -f1)
    local secret_name=$(echo "$first_secret" | cut -d'/' -f2)
    
    print_status "Using secret: $secret_name in namespace: $namespace"
    
    # Extract Docker config
    local docker_config=$(kubectl get secret "$secret_name" -n "$namespace" -o jsonpath='{.data.\.dockerconfigjson}' | base64 --decode)
    
    # Parse Docker config to extract registry, username, and password
    DOCKER_REGISTRY=$(echo "$docker_config" | jq -r '.auths | keys[0]')
    DOCKER_USERNAME=$(echo "$docker_config" | jq -r ".auths.\"$DOCKER_REGISTRY\".username")
    local docker_password=$(echo "$docker_config" | jq -r ".auths.\"$DOCKER_REGISTRY\".password")
    
    if [ -z "$DOCKER_REGISTRY" ] || [ -z "$DOCKER_USERNAME" ] || [ -z "$docker_password" ]; then
        print_error "Failed to extract Docker credentials from Kubernetes secret"
        exit 1
    fi
    
    print_success "Docker credentials extracted:"
    print_status "  Registry: $DOCKER_REGISTRY"
    print_status "  Username: $DOCKER_USERNAME"
    print_status "  Password: $docker_password"
    # Store password for later use
    DOCKER_PASSWORD="$docker_password"
}

# Function to set GitHub variables and secrets
setup_github_secrets() {
    print_status "Setting up GitHub variables and secrets..."
    
    local org_flag=""
    if [ "$SCOPE" = "org" ]; then
        org_flag="--org $ORG_NAME"
        print_status "Setting up for organization: $ORG_NAME"
    else
        print_status "Setting up for current repository"
    fi
    
    # Set variables
    print_status "Setting DOCKER_REGISTRY variable..."
    if gh variable set DOCKER_REGISTRY $org_flag --body "$DOCKER_REGISTRY"; then
        print_success "DOCKER_REGISTRY variable set"
    else
        print_error "Failed to set DOCKER_REGISTRY variable"
        exit 1
    fi
    
    print_status "Setting DOCKER_USERNAME variable..."
    if gh variable set DOCKER_USERNAME $org_flag --body "$DOCKER_USERNAME"; then
        print_success "DOCKER_USERNAME variable set"
    else
        print_error "Failed to set DOCKER_USERNAME variable"
        exit 1
    fi
    
    # Set secrets
    print_status "Setting DOCKER_PASSWORD secret..."
    if echo "$DOCKER_PASSWORD" | gh secret set DOCKER_PASSWORD $org_flag; then
        print_success "DOCKER_PASSWORD secret set"
    else
        print_error "Failed to set DOCKER_PASSWORD secret"
        exit 1
    fi
    
    print_status "Setting KUBE_CONFIG secret..."
    # Check if service account kubeconfig exists, otherwise use current kubeconfig
    if [ -f "workspace-kubeconfig.yaml" ]; then
        print_status "Using service account kubeconfig..."
        if cat workspace-kubeconfig.yaml | base64 -w 0 | gh secret set KUBE_CONFIG_WORKSPACE $org_flag -v all; then
            print_success "KUBE_CONFIG_WORKSPACE secret set (service account)"
        else
            print_error "Failed to set KUBE_CONFIG_WORKSPACE secret"
            exit 1
        fi
    else
        print_warning "Service account kubeconfig not found, using current kubeconfig"
        print_warning "Note: This may require OIDC authentication in GitHub Actions"
        if kubectl config view --raw | base64 -w 0 | gh secret set KUBE_CONFIG $org_flag; then
            print_success "KUBE_CONFIG_WORKSPACE secret set (current config)"
        else
            print_error "Failed to set KUBE_CONFIG_WORKSPACE secret"
            exit 1
        fi
    fi
}

# Function to verify setup
verify_setup() {
    print_status "Verifying setup..."
    
    local org_flag=""
    if [ "$SCOPE" = "org" ]; then
        org_flag="--org $ORG_NAME"
    fi
    
    print_status "Variables:"
    gh variable list $org_flag
    
    print_status "Secrets:"
    gh secret list $org_flag
    
    print_success "Setup verification complete"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --org)
            SCOPE="org"
            ORG_NAME="$2"
            if [ -z "$ORG_NAME" ]; then
                print_error "Organization name is required with --org flag"
                exit 1
            fi
            shift 2
            ;;
        --repo)
            SCOPE="repo"
            shift
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

# Default to repository scope if not specified
if [ -z "$SCOPE" ]; then
    SCOPE="repo"
fi

# Main execution
print_status "GitHub Secrets and Variables Setup Script"
print_status "=========================================="

check_prerequisites
extract_docker_credentials
setup_github_secrets
verify_setup

print_success "🎉 Setup complete!"

if [ "$SCOPE" = "org" ]; then
    print_status "All repositories in organization '$ORG_NAME' can now use these credentials"
else
    print_status "Current repository can now use these credentials"
fi

    print_status "Your GitHub Actions workflows can now access:"
    print_status "  - \${{ vars.DOCKER_REGISTRY }}"
    print_status "  - \${{ vars.DOCKER_USERNAME }}"
    print_status "  - \${{ secrets.DOCKER_PASSWORD }}"
    print_status "  - \${{ secrets.KUBE_CONFIG }}"
    print_status ""
    if [ -f "github-actions-kubeconfig.yaml" ]; then
        print_success "✅ Using service account authentication (no OIDC required)"
    else
        print_warning "⚠️  Using OIDC kubeconfig - consider creating service account"
        print_status "To create service account: kubectl apply -f github-actions-service-account.yaml"
    fi
