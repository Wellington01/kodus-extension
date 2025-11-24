---
title: "New API endpoints must have tests"
scope: "pull_request"
path: ["**/*"]
severity_min: "high"
buckets: ["testing"]
enabled: true
---

## Instructions
When new API endpoints are added, ensure corresponding tests are included in the PR.
- Check for new route definitions in controllers or commands.
- Verify that test files exist for these new functionalities.
- Ensure both positive and negative test cases are covered, following the structure of existing tests like those in `@file:src/__tests__/aiConfigService.test.ts`.

## Examples

### Bad example
Added new endpoint `/api/users/profile` but no test file included in the PR.

### Good example
Added new endpoint `/api/users/profile` with corresponding test file `tests/api/users/profile.test.ts` that covers success and error cases.
