# Database Setup Status

## Overview
We have successfully provisioned both PostgreSQL (SAP managed service) and LibSQL server for the mastra application, but are currently experiencing connection issues. Both services are provisioned and preserved for future use.

## Provisioned Services

### 1. PostgreSQL (SAP Managed Service)
- **Status**: ✅ Successfully provisioned
- **Service**: SAP managed PostgreSQL database
- **Configuration**: Available in values.yaml under `postgres` section
- **Connection Issue**: Currently experiencing connectivity problems
- **Preservation**: Kept provisioned for future use

### 2. LibSQL Server
- **Status**: ✅ Successfully provisioned and running
- **Deployment**: Custom deployment with root user privileges
- **Service**: `v1-libsql` service on port 8080
- **Connection**: Working locally within cluster
- **Configuration**: 
  - `SYNC_URL: "http://{{ .Release.Name }}-libsql:8080"`
  - Used for vector sync operations
  - No authentication required (development mode)

## Current State

### Working Configuration
- **Local Development**: Both services work locally
- **LibSQL**: Fully functional for sync operations
- **Mastra**: Can connect to LibSQL server successfully via HTTP
- **Database Files**: LibSQL database files are being updated (stats.json shows recent activity)

### Connection Issues
- **PostgreSQL**: Connection problems to SAP managed service
- **External Access**: Limited connectivity from cluster to external services
- **Authentication**: May require additional configuration for SAP services
- **LibSQL Protocol**: `libsql://` protocol fails with SSL/TLS errors (tries HTTPS instead of HTTP)
- **HTTP Protocol**: `http://` protocol works perfectly for database operations

### Current Decision
- **Keep Local**: Using LibSQL server locally for now
- **Preserve Services**: Both PostgreSQL and LibSQL services remain provisioned
- **HTTP Only**: Using HTTP connection instead of LibSQL protocol
- **Sync Status**: Database files show activity, sync appears to be working

### Test Results (Sep 26, 2025)
- **HTTP Connection**: ✅ Working perfectly via `http://v1-libsql:8080`
- **LibSQL Protocol**: ❌ Fails with SSL/TLS errors (tries HTTPS instead of HTTP)
- **Database Activity**: ✅ Confirmed via `stats.json` timestamp updates
- **API Format**: ✅ LibSQL HTTP API works with correct JSON format
- **Test Deployment**: ✅ Created separate test pod for connection validation

## Configuration Details

### LibSQL Server
```yaml
# chart/values.yaml
libsql:
  enabled: true
  image:
    repository: tursodatabase/libsql-server
    tag: latest
    registry: ghcr.io
  # Custom security context for root user
  runAsUser: 0
  runAsNonRoot: false
  allowPrivilegeEscalation: true
  env:
    SQLD_NODE: "primary"
    # SQLD_AUTH_JWT_KEY_FILE: "/home/.ssh/libsql.pub"  # Disabled for dev
```

### Mastra Environment
```yaml
# chart/values.yaml
mastra:
  env:
    SYNC_URL: "http://{{ .Release.Name }}-libsql:8080"
    # LIBSQL_DATABASE_URL: "libsql://v1-libsql:8080"  # Disabled for now
    pg: "false"  # PostgreSQL disabled
```

## Next Steps
1. **Investigate PostgreSQL connectivity** - Check network policies, service bindings
2. **Configure authentication** - Set up proper credentials for SAP services
3. **Test external connectivity** - Verify cluster can reach SAP managed services
4. **Enable LibSQL protocol** - Configure proper authentication when ready

## Files Modified
- `chart/values.yaml` - Database configuration
- `chart/templates/libsql-deployment-custom.yaml` - Custom LibSQL deployment
- `chart/templates/libsql-deployment.yaml` - PVC and Secret definitions
- `chart/Chart.yaml` - Removed web-application dependency for libsql

## Notes
- Provisioning took significant time, so services are preserved
- LibSQL server runs with root privileges as required by the application
- Both services are ready for future use once connectivity issues are resolved
- Current setup works for local development and testing
