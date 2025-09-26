# libSQL Server Setup Guide for Mastra

This guide explains how to set up a self-hosted libSQL server for Mastra, replacing the problematic PostgreSQL configuration.

## Overview

libSQL is a fork of SQLite that provides:
- Low query latency
- Built-in synchronization
- SQLite compatibility
- Self-hosted solution (no external accounts required)

## Prerequisites

1. **OpenSSL** (for key generation):
   ```bash
   # Usually pre-installed on most systems
   openssl version
   ```

2. **Kubernetes cluster** with kubectl access

## Quick Setup

Run the automated setup script:
```bash
./scripts/setup-libsql-keys.sh
```

## Manual Setup

### 1. Generate libSQL Keys

```bash
# Create keys directory
mkdir -p ./keys

# Generate private key
openssl genrsa -out ./keys/libsql.pem 2048

# Generate public key
openssl rsa -in ./keys/libsql.pem -pubout -out ./keys/libsql.pub
```

### 2. Create Kubernetes Secret

```bash
# Create base64 encoded public key
PUBLIC_KEY_B64=$(base64 -i ./keys/libsql.pub | tr -d '\n')

# Create the secret
kubectl create secret generic libsql-keys \
  --from-literal=libsql.pub="$PUBLIC_KEY_B64" \
  --namespace=devspace
```

### 3. Deploy libSQL Server

```bash
# Switch to libSQL configuration
./scripts/switch-database.sh libsql
```

## Configuration Details

### Memory Configuration

The `memory.ts` file now supports three storage modes:

1. **PostgreSQL** (when `pg: true` and PostgreSQL is available)
2. **libSQL Server** (when `LIBSQL_DATABASE_URL` is set)
3. **Local SQLite** (fallback)

### Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `LIBSQL_DATABASE_URL` | libSQL server URL | `libsql://libsql:8080` |
| `LIBSQL_AUTH_TOKEN` | libSQL auth token (optional) | `""` |
| `SYNC_URL` | Local sync server URL | `http://libsql:8080` |
| `pg` | Enable PostgreSQL | `false` |

### Deployment Components

The setup includes:

- **libSQL Deployment**: Kubernetes deployment for libSQL server
- **libSQL Service**: ClusterIP service exposing libSQL on ports 8080 and 5001
- **Persistent Volume**: 1Gi storage for libSQL data
- **Secret**: Contains libSQL public key for authentication
- **Environment Variables**: Configured in the mastra deployment

## Troubleshooting

### Connection Issues

1. **Check libSQL Server Status**:
   ```bash
   kubectl get pods -l component=libsql
   ```

2. **Verify libSQL Service**:
   ```bash
   kubectl get svc -l component=libsql
   ```

3. **Check Pod Logs**:
   ```bash
   kubectl logs -l app=mastra -c mastra
   kubectl logs -l component=libsql
   ```

### Common Issues

1. **Missing Keys**: Run `./scripts/setup-libsql-keys.sh` to generate keys
2. **Secret Not Found**: Apply the secret with `kubectl apply -f ./libsql-keys-secret.yaml`
3. **Sync Issues**: Check the libSQL service is running: `kubectl get svc -l component=libsql`

## Benefits of libSQL Server

- **Self-Hosted**: No external dependencies or accounts
- **SQLite Compatibility**: No schema changes needed
- **Built-in Sync**: Automatic data synchronization
- **Cost Effective**: No external service costs
- **Reliable**: Built on proven SQLite technology
- **Secure**: Full control over your data and keys

## Next Steps

1. Monitor the deployment: `kubectl get pods -l app=mastra`
2. Check logs for any issues: `kubectl logs -l app=mastra -c mastra`
3. Test the memory functionality through the API
4. Consider setting up monitoring and alerting

## Resources

- [libSQL Documentation](https://libsql.org/)
- [libSQL Server GitHub](https://github.com/tursodatabase/libsql)
- [Mastra Memory Documentation](https://mastra.ai/docs/memory)
