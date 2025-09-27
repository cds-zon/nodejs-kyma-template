# GitHub Secrets Setup Scripts

This directory contains scripts to help set up GitHub Actions secrets and variables for Kubernetes and Docker deployments.

## 🚀 Quick Start

### For Repository-level Setup
```bash
# Set up secrets for current repository
./scripts/setup-github-secrets.sh --repo

# Or simply (defaults to repo)
./scripts/setup-github-secrets.sh
```

### For Organization-level Setup
```bash
# Set up secrets for entire organization
./scripts/setup-github-secrets.sh --org your-org-name
```

## 📋 Prerequisites

Before running the script, ensure you have:

1. **kubectl** installed and configured
   ```bash
   kubectl cluster-info  # Should connect successfully
   ```

2. **GitHub CLI** installed and authenticated
   ```bash
   gh auth login
   # For organization setup, you need admin:org scope:
   gh auth refresh -s admin:org
   ```

3. **Required permissions**:
   - For repository setup: `repo` scope
   - For organization setup: `admin:org` scope

## 🔧 What the Script Does

The script automatically:

1. **Discovers** Docker registry secrets from your Kubernetes cluster
2. **Extracts** Docker credentials (registry URL, username, password)
3. **Captures** your current kubeconfig for cluster access
4. **Sets up** GitHub variables and secrets:
   - `DOCKER_REGISTRY` (variable)
   - `DOCKER_USERNAME` (variable)
   - `DOCKER_PASSWORD` (secret)
   - `KUBE_CONFIG` (secret)

## 📖 Usage Examples

```bash
# Show help
./scripts/setup-github-secrets.sh --help

# Set up for current repository
./scripts/setup-github-secrets.sh --repo

# Set up for organization 'my-company'
./scripts/setup-github-secrets.sh --org my-company

# Default behavior (repository-level)
./scripts/setup-github-secrets.sh
```

## 🔍 Verification

After running the script, you can verify the setup:

```bash
# Check repository variables/secrets
gh variable list
gh secret list

# Check organization variables/secrets
gh variable list --org your-org-name
gh secret list --org your-org-name
```

## 🔐 Security Notes

- All secrets are stored securely in GitHub and are not visible in logs
- The script extracts credentials from your current Kubernetes context
- Make sure your kubectl is connected to the correct cluster before running
- Organization-level secrets are available to all repositories in the org

## 🛠️ Troubleshooting

### Common Issues

1. **"kubectl cannot connect to cluster"**
   - Check your kubeconfig: `kubectl config current-context`
   - Ensure you're connected to the right cluster

2. **"GitHub CLI is not authenticated"**
   - Run: `gh auth login`
   - For org setup: `gh auth refresh -s admin:org`

3. **"403 Forbidden" when setting org secrets**
   - You need organization admin permissions
   - Contact your GitHub org admin

4. **"No Docker registry secrets found"**
   - Ensure your cluster has Docker registry secrets
   - Check: `kubectl get secrets --all-namespaces | grep docker`

## 📝 Script Output

The script provides colored output to show progress:
- 🔵 **[INFO]** - General information
- 🟢 **[SUCCESS]** - Successful operations  
- 🟡 **[WARNING]** - Warnings
- 🔴 **[ERROR]** - Errors that stop execution

## 🔄 Re-running the Script

The script is idempotent - you can run it multiple times safely. It will update existing secrets/variables with current values from your cluster.
