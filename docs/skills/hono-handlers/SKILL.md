---
name: hono-handlers
description: Create perfect handlers for hono following the project styleguide.
---

# Hono Handler Skill

Add a handler for hono following the project styleguide. The handler should be responsible for handling HTTP requests and responses, and should delegate business logic to the domains layer. The handler should also handle any necessary validation and error handling. The handler must follow the Hono framework and not pass Request/Responses objects to the domains.

## When to use

Use this skill when you need to create a new endpoint for the API or when you need to update an existing endpoint. The handler is the entry point for the API and is responsible for handling the HTTP requests and responses, so it's important to follow the project styleguide to ensure consistency and maintainability.

## How to use

When asked to add or edit any handler:

1. Create a new file in the `handlers/` directory with the name of the handler if it's necessary, in camelCase (e.g., `getOffersHandler.ts`).
2. Create a typescript class if it's necessary with the name of the handler, in PascalCase (e.g., `GetOffersHandler`).
3. Add a method to the class that will handle the HTTP request, in camelCase (e.g., `handle`).
4. Add validation for the request parameters if necessary, using a validation library or custom validation logic.
5. Do use domain services to handle the business logic, and do not pass Request/Responses objects to the domains.
6. Return a json response with the appropriate status code and data.

### Template

```typescript
class OffersHandler {
  async handle(context: Context) {
    try {
      // Get params
      const id = c.req.params("id");

      // Get body if necessary
      const { name } = c.req.body();

      // Call domain services to handle business logic
      const offers = await someDomainService.getOffers(id, name);

      // Return a not found response if the offers are not found
      if (!offers) {
        return c.notFound();
      }

      // Return a json response with the appropriate status code and data
      return c.json(offers, 200);
    } catch (error) {
      // Handle errors and return appropriate error response
      return c.json({ error: error.message }, 500);
    }
  }
}
```
