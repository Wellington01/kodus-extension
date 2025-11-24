---
title: "Avoid console.log in production code"
scope: "file"
path: ["src/**/*.ts", "src/**/*.tsx"]
severity_min: "medium"
languages: ["jsts"]
buckets: ["style-conventions"]
enabled: true
---

## Instructions
Check for console.log statements in production TypeScript/JavaScript files.
- Console logs should not appear in production code
- Use proper logging libraries instead
- Allow console.log only in development utilities

## Examples

### Bad example
```typescript
function processUser(user: User) {
  console.log('Processing user:', user.id);
  return user.process();
}
```

### Good example
```typescript
import { logger } from './logger';

function processUser(user: User) {
  logger.info('Processing user:', user.id);
  return user.process();
}
```
