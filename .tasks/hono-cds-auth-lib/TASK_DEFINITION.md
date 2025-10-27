# Task: Create Reusable Hono CDS Auth Middleware Library

**Created**: 2025-10-27
**Last Updated**: 2025-10-27
**Category**: [LIBRARY-DEVELOPMENT]
**Timeline**: Initial task setup

## Overview
Create a standalone, reusable library for Hono authentication middleware that integrates with SAP CDS auth providers (dummy, mock, IAS).

## Goals
- Extract auth logic from Mastra package into standalone library
- Support three auth providers: dummy, mock, and IAS
- Package with pkgroll for distribution
- Provide working Hono server example
- Include comprehensive tests for all providers
- Export as middleware and Hono factory/app

## Requirements
1. **No Mastra dependencies** - only SAP packages and Hono
2. **Provider support**: dummy, mock, IAS
3. **Packaging**: Use pkgroll
4. **Runtime**: tsx for development
5. **Exports**: Middleware function and Hono app factory
6. **Tests**: Cover all three auth providers
7. **Example**: Working Hono server implementation

## Acceptance Criteria
- [ ] Library builds successfully with pkgroll
- [ ] Middleware works with dummy provider
- [ ] Middleware works with mock provider
- [ ] Middleware works with IAS provider
- [ ] Example server runs with tsx
- [ ] All tests pass
- [ ] Package exports are properly configured
- [ ] Documentation is complete

## Technical Approach
- Extract auth middleware logic from `app/mastra/src/mastra/middleware/auth.ts`
- Extract provider logic from `app/mastra/src/mastra/auth/index.ts`
- Create provider implementations for dummy, mock, and IAS
- Set up pkgroll for building
- Create example Hono server
- Create test suite using the patterns from existing tests
