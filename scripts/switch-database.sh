#!/bin/bash

# Database Switch Script for Mastra
# This script allows easy switching between PostgreSQL and Turso

set -e

VALUES_FILE="chart/values.yaml"

usage() {
    echo "Usage: $0 [postgres|libsql|sqlite]"
    echo ""
    echo "Options:"
    echo "  postgres  - Enable PostgreSQL (requires working PostgreSQL service)"
    echo "  libsql    - Enable self-hosted libSQL server"
    echo "  sqlite    - Use local SQLite (fallback)"
    echo ""
    echo "Examples:"
    echo "  $0 postgres  # Switch to PostgreSQL"
    echo "  $0 libsql   # Switch to libSQL server"
    echo "  $0 sqlite   # Switch to local SQLite"
}

switch_to_postgres() {
    echo "🔄 Switching to PostgreSQL..."
    
    # Update values.yaml
    sed -i.bak 's/# POSTGRES_URL: postgres:\/\/postgres:postgres@postgresql:5432\/postgres/POSTGRES_URL: postgres:\/\/postgres:postgres@postgresql:5432\/postgres/' $VALUES_FILE
    sed -i.bak 's/pg: "false"/pg: "true"/' $VALUES_FILE
    sed -i.bak 's/LIBSQL_DATABASE_URL: "libsql:\/\/libsql:8080"/# LIBSQL_DATABASE_URL: "libsql:\/\/libsql:8080"/' $VALUES_FILE
    sed -i.bak 's/LIBSQL_AUTH_TOKEN: ""/# LIBSQL_AUTH_TOKEN: ""/' $VALUES_FILE
    
    echo "✅ PostgreSQL enabled"
    echo "⚠️  Note: Ensure PostgreSQL service is running and accessible"
}

switch_to_libsql() {
    echo "🔄 Switching to libSQL server..."
    
    # Update values.yaml
    sed -i.bak 's/POSTGRES_URL: postgres:\/\/postgres:postgres@postgresql:5432\/postgres/# POSTGRES_URL: postgres:\/\/postgres:postgres@postgresql:5432\/postgres/' $VALUES_FILE
    sed -i.bak 's/pg: "true"/pg: "false"/' $VALUES_FILE
    sed -i.bak 's/# LIBSQL_DATABASE_URL: "libsql:\/\/libsql:8080"/LIBSQL_DATABASE_URL: "libsql:\/\/libsql:8080"/' $VALUES_FILE
    sed -i.bak 's/LIBSQL_AUTH_TOKEN: ""/LIBSQL_AUTH_TOKEN: ""/' $VALUES_FILE
    
    echo "✅ libSQL server enabled"
    echo "ℹ️  libSQL server will be deployed as a self-hosted solution"
    echo "   No external account required"
}

switch_to_sqlite() {
    echo "🔄 Switching to local SQLite..."
    
    # Update values.yaml
    sed -i.bak 's/POSTGRES_URL: postgres:\/\/postgres:postgres@postgresql:5432\/postgres/# POSTGRES_URL: postgres:\/\/postgres:postgres@postgresql:5432\/postgres/' $VALUES_FILE
    sed -i.bak 's/pg: "true"/pg: "false"/' $VALUES_FILE
    sed -i.bak 's/LIBSQL_DATABASE_URL: "libsql:\/\/libsql:8080"/# LIBSQL_DATABASE_URL: "libsql:\/\/libsql:8080"/' $VALUES_FILE
    sed -i.bak 's/LIBSQL_AUTH_TOKEN: ""/# LIBSQL_AUTH_TOKEN: ""/' $VALUES_FILE
    
    echo "✅ Local SQLite enabled"
    echo "ℹ️  This is the fallback option - no external dependencies"
}

deploy() {
    echo "🚀 Deploying updated configuration..."
    
    # Build and deploy
    npm run build
    helm upgrade v1 ./gen/chart --install --create-namespace
    
    echo "✅ Deployment complete"
    echo "📊 Check status: kubectl get pods -l app=mastra"
    echo "📋 Check logs: kubectl logs -l app=mastra -c mastra"
}

# Main script
case "${1:-}" in
    postgres)
        switch_to_postgres
        deploy
        ;;
    libsql)
        switch_to_libsql
        deploy
        ;;
    sqlite)
        switch_to_sqlite
        deploy
        ;;
    deploy)
        deploy
        ;;
    *)
        usage
        exit 1
        ;;
esac
