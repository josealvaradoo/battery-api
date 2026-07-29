# Changelog

## 0.2.0 (2026-07-29)

---

### Features

- auth: add api key authentication middleware with whitelist support
- auth: add auth router middleware to handle jwt and api key strategies
- tests: add handler tests with bun test for status and auth endpoints

### Bug fixes

- auth: add token logging in google auth handler for debugging

### Chores

- docs: add project agents config and skills documentation
- docs: add http request examples for handlers
- config: exclude test files from typescript build output
- config: add test script to package.json
