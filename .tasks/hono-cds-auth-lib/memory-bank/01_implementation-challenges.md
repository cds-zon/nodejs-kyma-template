# Implementation Challenges and Solutions

**Created**: 2025-10-27
**Last Updated**: 2025-10-27
**Category**: [DEBUGGING]
**Timeline**: 01 of 02 - Implementation phase learnings

## Challenge 1: ES Module vs CommonJS

### Problem
Initial implementation used `require('@sap/cds')` which doesn't work in ES modules.

### Solution
Changed all providers to use ES module imports:
```typescript
import cds from '@sap/cds';  // NOT import type cds
```

This ensures `cds.User` and `cds.env` are available at runtime.

## Challenge 2: Mock User ID Not Set

### Problem
Mock users were being authenticated, but `user.id` was `undefined` during authorization.

### Symptoms
```
🔐 Mock Auth - Authenticated user: alice
🔐 Mock Auth - Authorizing user: undefined, has user: true
```

### Root Cause
CDS configuration may return user objects without an explicit `id` field, expecting the key to be used as the ID.

### Solution
Added fallback logic in `loadMockUsers()`:
```typescript
for (const [username, userData] of Object.entries(mockUsers)) {
  const user = userData as MockUser;
  // Ensure id is set if not provided
  if (!user.id) {
    user.id = username;
  }
  this.users.set(username, user);
}
```

## Challenge 3: CDS User Object Structure

### Investigation
Tested CDS User creation:
```typescript
const user = new cds.User({
  id: 'testuser',
  roles: ['admin'],
  attr: { name: 'Test' }
});
```

### Findings
- User object has `id`, `roles`, `attr` properties
- `roles` array is converted to object: `['admin'] -> {admin: 1}`
- `id` property is directly accessible
- Object is properly JSON-serializable

## Challenge 4: TypeScript Type Imports

### Problem
Using `import type` for runtime values caused undefined errors.

### Solution
- Use `import type` only for type annotations
- Use regular `import` for runtime values (cds, HonoRequest, etc.)

## Best Practices Learned

1. **Always import cds as value**: `import cds from '@sap/cds'`
2. **Check for missing IDs**: Fallback to username/key when loading users
3. **Debug with structured logging**: Include relevant context in logs
4. **Test user object structure**: Verify CDS User creation before using
5. **Handle CDS configuration variants**: Different environments may structure auth.users differently
