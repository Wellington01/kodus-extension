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
- Check for new route definitions in controllers
- Verify test files exist for new endpoints
- Ensure both positive and negative test cases

## Examples

### Bad example
Added new endpoint `/api/users/profile` but no test file included in the PR.

### Good example
Added new endpoint `/api/users/profile` with corresponding test file `tests/api/users/profile.test.ts` that covers success and error cases.
