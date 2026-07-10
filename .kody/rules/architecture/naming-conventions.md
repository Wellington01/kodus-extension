---
title: "Service class and method naming"
scope: "file"
path: ["src/services/**/*.ts", "src/commands/**/*.ts"]
severity_min: "medium"
languages: ["jsts"]
buckets: ["naming-conventions"]
enabled: true
---

## Instructions

**NAME1** Classes exported from `src/services/**` or `src/commands/**` MUST be
named with a `Service` suffix, and their methods MUST use camelCase verbs.

- A class exported from either path that does not end in `Service` violates **NAME1**.
- A method named in snake_case or PascalCase violates **NAME1**.

## Examples

### Bad example

```typescript
export class aiChat {          // missing `Service` suffix — violates NAME1
    Get_Response() {}          // snake/Pascal method name — violates NAME1
}
```

### Good example

```typescript
export class AiChatService {
    getResponse() {}
}
```
