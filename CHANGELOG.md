# Changelog

## 0.5.0 (2026-08-17)

---

### Features

- alexa: add POST /alexa endpoint as backend for the "planta" custom skill (es-US, Spanish responses)
- alexa: verify skill id against ALEXA_SKILL_IDS whitelist before processing requests
- alexa: handle battery level and home consumption intents with cached Growatt data
- alexa: add interaction model JSON for the Alexa Developer Console
- tests: isolate test files to prevent mock.module leakage between suites

## 0.4.0 (2026-08-06)

---

- logger: add new middleware to log every endpoint triggered

## 0.3.0 (2026-07-29)

---

### Features

- status: expose household power consumption as `consumption_watts` (number) sourced from Growatt's `pacToUser` field

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
