---
name: hono-errors
description: Create perfect error for hono following the project styleguide.
---

# Hono Errors Skill

Add a new error for hono following the project styleguide. The error should define the custom error classes used in the application, and should also handle any necessary validation and error handling. The error must follow TypeScript best practices and should be designed to work seamlessly with the domains and handlers layers.

## When to use

Use this skill when you need to define a new custom error class for the application. Custom errors are useful for providing more specific error messages and handling specific error cases in the domains and handlers layers, so it's important to follow the project styleguide to ensure consistency and maintainability.

## How to use

When asked to add or edit any error:

1. Create a new file in the `models/(model)/errors.ts` if it's necessary.
2. Create a typescript class which extends from Error and add a message in its constructor.

### Template

```typescript
export class OffersNotFoundError extends Error {
  constructor() {
    super("Offers not found");
    this.name = "OffersNotFoundError";
  }
}
```
