---
name: hono-models
description: Create perfect models for hono following the project styleguide.
---

# Hono Models Skill

Add a new model for hono following the project styleguide. The model should define the data structures and types used in the application, and should also handle any necessary validation and error handling. The model must follow TypeScript best practices and should be designed to work seamlessly with the domains and handlers layers.

## When to use

Use this skill when you need to define a new data structure or type for the application. The model is responsible for defining the shape of the data and should be designed to work seamlessly with the domains and handlers layers, so it's important to follow the project styleguide to ensure consistency and maintainability.

## How to use

When asked to add or edit any model:

1. Create a new file in the `models/(model)/` directory with the name of the model if it's necessary, in camelCase (e.g., `offer.ts`).
2. Create a typescript struct if it's necessary with the name of the handler, in PascalCase (e.g., `AvailableOffer`).
3. Add properties to the struct that will define the shape of the data, using appropriate types and interfaces.

### Template

```typescript
export type Offer = {
  name: string;
  price: number;
};
```
