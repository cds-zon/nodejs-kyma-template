# GitHub Actions Kubernetes Setup

This directory contains all the necessary files and scripts to set up Kubernetes authentication and Docker registry access for GitHub Actions workflows.

## 📁 Directory Structure

```
.github/k8s-setup/
├── README.md                           # This documentation
├── github-actions-service-account.yaml # Complete RBAC setup for GitHub Actions
├── create-sa-kubeconfig.sh            # Script to generate service account kubeconfig
├── setup-github-secrets.sh            # Script to set up GitHub secrets and variables
└── github-actions-kubeconfig.yaml     # Generated service account kubeconfig
```

## 🚀 Quick Setup for New Projects

### Step 1: Create Service Account and RBAC
```bash
kubectl apply -f .github/k8s-setup/github-actions-service-account.yaml
```

### Step 2: Generate Service Account Kubeconfig
```bash
cd .github/k8s-setup/
./create-sa-kubeconfig.sh
```

### Step 3: Set up GitHub Secrets
```bash
# For repository-level secrets
./setup-github-secrets.sh --repo

# For organization-level secrets
./setup-github-secrets.sh --org your-org-name
```

## 📋 What Gets Created

### 🔐 Kubernetes Resources
- **ServiceAccount**: `github-actions-deployer` in `devspace` namespace
- **ClusterRole**: Comprehensive permissions for Kyma/SAP deployments
- **ClusterRoleBinding**: Binds service account to permissions
- **Secret**: Service account token for authentication

### 🔑 GitHub Secrets/Variables
- **`DOCKER_REGISTRY`** (variable): Docker registry URL
- **`DOCKER_USERNAME`** (variable): Docker registry username  
- **`DOCKER_PASSWORD`** (secret): Docker registry password
- **`KUBE_CONFIG`** (secret): Service account-based kubeconfig

## 🛡️ Permissions Included

The service account has permissions for:

### Core Kubernetes Resources
- pods, services, endpoints, persistentvolumeclaims, events, configmaps, secrets, serviceaccounts
- deployments, daemonsets, replicasets, statefulsets
- ingresses, networkpolicies, jobs, cronjobs, horizontalpodautoscalers

### SAP Cloud Platform Resources
- servicebindings, serviceinstances

### Kyma Platform Resources
- apirules, ratelimits, customconfigs, registrycacheconfigs
- subscriptions (eventing)

### SAP Connectivity Resources
- connectivityproxies, servicemappings, destinations

### Istio Service Mesh Resources
- destinationrules, gateways, serviceentries, sidecars, virtualservices
- authorizationpolicies, peerauthentications, requestauthentications
- wasmplugins

## 🔧 Usage in GitHub Actions

Your workflows can now use these variables and secrets:

```yaml
steps:
  - uses: ./.github/actions/kyma-setup
    with:
      registry: ${{ vars.DOCKER_REGISTRY }}
      user: ${{ vars.DOCKER_USERNAME }}
      password: ${{ secrets.DOCKER_PASSWORD }}
      kube-config: ${{ secrets.KUBE_CONFIG }}
```

## 📖 File Descriptions

### `github-actions-service-account.yaml`
Complete RBAC configuration including:
- ServiceAccount definition
- ClusterRole with comprehensive permissions
- ClusterRoleBinding
- Secret for service account token

### `create-sa-kubeconfig.sh`
Utility script that:
- Extracts service account token and CA certificate
- Generates a kubeconfig file for the service account
- Provides usage instructions

### `setup-github-secrets.sh`
Automation script that:
- Discovers Docker credentials from your Kubernetes cluster
- Sets up GitHub repository or organization variables/secrets
- Includes comprehensive error handling and validation

### `github-actions-kubeconfig.yaml`
Generated kubeconfig file that:
- Uses service account token authentication (no OIDC)
- Points to your Kyma cluster
- Sets `devspace` as default namespace

## 🔄 For New Organizations/Projects

1. **Copy this directory** to your new project
2. **Run the setup scripts** in order
3. **Customize namespace** if needed by editing the YAML files
4. **Test deployment** with your GitHub Actions

## 🛠️ Troubleshooting

### Common Issues

1. **"Forbidden" errors during deployment**
   - Check if service account has the required permissions
   - Add missing permissions to the ClusterRole in `github-actions-service-account.yaml`

2. **"Service account token not found"**
   - Wait a few seconds for Kubernetes to create the token
   - Check if the secret exists: `kubectl get secret github-actions-deployer-token -n devspace`

3. **GitHub CLI authentication issues**
   - For organization setup: `gh auth refresh -s admin:org`
   - For repository setup: `gh auth login`

## 🔐 Security Notes

- Service account tokens are long-lived but can be rotated
- ClusterRole permissions are scoped to necessary resources only
- GitHub secrets are encrypted and only accessible to workflows
- Default namespace is `devspace` - change if needed for your environment

## 🎯 Benefits of This Approach

- ✅ **No OIDC complexity** in CI/CD pipelines
- ✅ **Comprehensive permissions** for Kyma/SAP deployments  
- ✅ **Reusable setup** for multiple projects
- ✅ **Clear organization** under `.github/` directory
- ✅ **Version controlled** RBAC configuration
