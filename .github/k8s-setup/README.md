# Kubernetes Setup Scripts

This directory contains scripts and manifests for setting up Kubernetes access for different environments.

## Overview

- **GitHub Actions**: Service account for CI/CD deployments
- **Workspace/DevContainer**: Service account for local development

## Quick Start

### For GitHub Actions (CI/CD)

1. **Create the service account:**
   ```bash
   kubectl apply -f github-actions-sa.yaml
   ```

2. **Generate the kubeconfig:**
   ```bash
   ./create-sa-kubeconfig.sh
   ```

3. **Add to GitHub Secrets:**
   ```bash
   # Encode the kubeconfig for GitHub secrets
   cat github-actions-kubeconfig.yaml | base64 -w 0
   ```
   
   Then add as `KUBE_CONFIG` secret in your GitHub repository.

### For Workspace/DevContainer (Local Development)

1. **Create the service account:**
   ```bash
   kubectl apply -f workspace-sa.yaml
   ```

2. **Generate the kubeconfig:**
   ```bash
   ./create-workspace-kubeconfig.sh
   ```

3. **Use the kubeconfig:**
   ```bash
   # Option 1: Export for current session
   export KUBECONFIG=$(pwd)/workspace-kubeconfig.yaml
   kubectl get pods
   
   # Option 2: Merge with existing kubeconfig
   KUBECONFIG=~/.kube/config:$(pwd)/workspace-kubeconfig.yaml kubectl config view --flatten > ~/.kube/config.new
   mv ~/.kube/config.new ~/.kube/config
   ```

4. **For DevContainer** (add to `.devcontainer/devcontainer.json`):
   ```json
   {
     "containerEnv": {
       "KUBECONFIG": "/workspace/workspace-kubeconfig.yaml"
     },
     "mounts": [
       "source=${localWorkspaceFolder}/workspace-kubeconfig.yaml,target=/workspace/workspace-kubeconfig.yaml,type=bind"
     ]
   }
   ```

## Service Account Permissions

### Permission Model Overview

Each service account uses a combination of Kubernetes RBAC resources:

- **Role + RoleBinding**: Namespace-scoped permissions (write access in `devspace`)
- **ClusterRole + ClusterRoleBinding**: Cluster-wide permissions (read-only across all namespaces)

This model provides:
- 🔒 **Security**: Write operations limited to designated namespace
- 👀 **Visibility**: Read access across cluster for debugging and monitoring
- 🎯 **Flexibility**: Can inspect resources in any namespace without risk of accidental modifications

### GitHub Actions Service Account (`github-actions-deployer`)

**Purpose**: CI/CD deployments with restricted permissions

**Permissions**:
- ✅ Deploy and update applications (Deployments, Services)
- ✅ Manage configurations (ConfigMaps, Secrets)
- ✅ View logs and status
- ✅ Manage Kyma resources (Functions, APIRules, Subscriptions)
- ❌ No cluster-admin access
- ❌ Limited to `devspace` namespace

### Workspace Developer Service Account (`workspace-developer`)

**Purpose**: Local development with broader permissions

**Namespace-scoped Permissions (devspace)** - Full write access:
- ✅ **Core resources**: pods, services, endpoints, configmaps, secrets, events, serviceaccounts
- ✅ **Workloads**: deployments, statefulsets, daemonsets, replicasets, jobs, cronjobs
- ✅ **Storage**: persistentvolumeclaims
- ✅ **Networking**: ingresses, networkpolicies
- ✅ **Scaling**: horizontalpodautoscalers
- ✅ **Policy**: poddisruptionbudgets
- ✅ **RBAC**: roles, rolebindings (namespace-scoped)
- ✅ **Kyma**: functions, apirules, subscriptions
- ✅ **SAP BTP Operator**: servicebindings, serviceinstances
- ✅ **Advanced pod operations**: exec, logs, port-forward, status

**Cluster-wide Permissions (all namespaces)** - Read-only access:
- ✅ **Core resources**: pods, services, events, configmaps, nodes, namespaces, PVs/PVCs
- ✅ **Workloads**: deployments, statefulsets, daemonsets, replicasets, jobs, cronjobs
- ✅ **Networking**: ingresses, networkpolicies
- ✅ **Scaling & Policy**: horizontalpodautoscalers, poddisruptionbudgets
- ✅ **RBAC**: view roles and rolebindings across namespaces
- ✅ **Kyma resources**: view all Kyma resources cluster-wide
- ✅ **SAP BTP resources**: view servicebindings and serviceinstances cluster-wide
- ✅ **Logs**: access pod logs from any namespace
- ❌ **No write access** outside `devspace` namespace
- ❌ **No cluster-admin** access (cannot modify cluster-scoped resources)

## Scripts

### `create-sa-kubeconfig.sh`

Creates a kubeconfig file for GitHub Actions using the `github-actions-deployer` service account.

**Usage**:
```bash
./create-sa-kubeconfig.sh
```

**Environment Variables**:
- `NAMESPACE` - Target namespace (default: `devspace`)
- `SERVICE_ACCOUNT` - Service account name (default: `github-actions-deployer`)
- `SECRET_NAME` - Secret name (default: `github-actions-deployer-token`)

### `create-workspace-kubeconfig.sh`

Creates a kubeconfig file for workspace/devcontainer use.

**Usage**:
```bash
./create-workspace-kubeconfig.sh
```

**Environment Variables**:
- `NAMESPACE` - Target namespace (default: `devspace`)
- `SERVICE_ACCOUNT` - Service account name (default: `workspace-developer`)
- `SECRET_NAME` - Secret name (default: `workspace-developer-token`)
- `OUTPUT_FILE` - Output filename (default: `workspace-kubeconfig.yaml`)

**Example with custom values**:
```bash
NAMESPACE=dev-team OUTPUT_FILE=my-kubeconfig.yaml ./create-workspace-kubeconfig.sh
```

## Security Best Practices

### 1. Keep kubeconfig files out of version control

Add to `.gitignore`:
```
*kubeconfig.yaml
workspace-kubeconfig.yaml
github-actions-kubeconfig.yaml
```

### 2. Rotate tokens regularly

For GitHub Actions:
```bash
kubectl delete secret github-actions-deployer-token -n devspace
kubectl apply -f github-actions-sa.yaml
./create-sa-kubeconfig.sh
# Update GitHub secret
```

For Workspace:
```bash
kubectl delete secret workspace-developer-token -n devspace
kubectl apply -f workspace-sa.yaml
./create-workspace-kubeconfig.sh
```

### 3. Use different service accounts for different purposes

- Don't use GitHub Actions SA for local development
- Don't use Workspace SA for CI/CD
- Create team-specific SAs if needed

### 4. Monitor service account usage

```bash
# Check service account permissions
kubectl auth can-i --list --as=system:serviceaccount:devspace:workspace-developer -n devspace

# View recent token usage
kubectl get events -n devspace --field-selector involvedObject.name=workspace-developer
```

## Troubleshooting

### "Secret not found" error

Make sure you've applied the service account manifest first:
```bash
kubectl apply -f workspace-sa.yaml
# or
kubectl apply -f github-actions-sa.yaml
```

### "Forbidden" errors when using kubeconfig

Check the role bindings:
```bash
kubectl get rolebinding -n devspace
kubectl describe role workspace-developer-role -n devspace
```

### Token expired

Kubernetes service account tokens don't expire by default, but if you're getting authentication errors:
```bash
# Recreate the secret
kubectl delete secret workspace-developer-token -n devspace
kubectl apply -f workspace-sa.yaml
./create-workspace-kubeconfig.sh
```

### Different namespace

To use a different namespace:
```bash
NAMESPACE=my-namespace ./create-workspace-kubeconfig.sh
```

Make sure the service account exists in that namespace:
```bash
kubectl get sa workspace-developer -n my-namespace
```

## Files

- `workspace-sa.yaml` - Service account manifest for workspace/devcontainer
- `github-actions-sa.yaml` - Service account manifest for GitHub Actions (if exists)
- `create-workspace-kubeconfig.sh` - Script to generate workspace kubeconfig
- `create-sa-kubeconfig.sh` - Script to generate GitHub Actions kubeconfig
- `README.md` - This file

## Permission Examples

### What Works with Workspace Developer SA

**✅ Read operations across all namespaces:**
```bash
# List all pods cluster-wide
kubectl get pods --all-namespaces

# View pods in any namespace
kubectl get pods -n kube-system

# View logs from any namespace
kubectl logs -n production my-app-pod

# Describe resources anywhere
kubectl describe deployment -n staging my-app
```

**✅ Write operations in devspace namespace:**
```bash
# Create resources in devspace
kubectl apply -f deployment.yaml -n devspace

# Delete pods in devspace
kubectl delete pod my-pod -n devspace

# Execute into pods in devspace
kubectl exec -it my-pod -n devspace -- /bin/bash

# Port forward in devspace
kubectl port-forward -n devspace my-pod 8080:8080

# View and manage events
kubectl get events -n devspace
kubectl describe events -n devspace

# Create RBAC resources
kubectl create role my-role -n devspace --verb=get --resource=pods
kubectl create rolebinding my-binding -n devspace --role=my-role --serviceaccount=devspace:my-sa

# Manage autoscaling
kubectl autoscale deployment my-app -n devspace --min=2 --max=10
```

### What Doesn't Work

**❌ Write operations outside devspace:**
```bash
# This will fail - cannot create in other namespaces
kubectl apply -f deployment.yaml -n production

# This will fail - cannot delete in other namespaces
kubectl delete pod my-pod -n kube-system

# This will fail - cannot exec into pods outside devspace
kubectl exec -it my-pod -n production -- /bin/bash
```

**❌ Cluster-admin operations:**
```bash
# Cannot create namespaces
kubectl create namespace new-namespace

# Cannot modify cluster-wide resources
kubectl create clusterrole my-role

# Cannot modify nodes
kubectl drain node-1
```

## Additional Resources

- [Kubernetes RBAC Documentation](https://kubernetes.io/docs/reference/access-authn-authz/rbac/)
- [Kyma Documentation](https://kyma-project.io/docs/)
- [Service Account Tokens](https://kubernetes.io/docs/reference/access-authn-authz/service-accounts-admin/)
