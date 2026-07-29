---
name: hono-domains
description: Create perfect domains for hono following the project styleguide.
---

# Hono Domains Skill

Add a domain for hono following the project styleguide. The domain should contain the business logic into class methods which must follow as the SOLID principles, as DRY and KISS. Every domain represents a specific business logic and should be independent from the HTTP layer, so it should not have any dependency on the Request/Responses objects. The domain should also handle any necessary validation and error handling. The domain doesn't know anything about the repository logic.

## When to use

Use this skill when you need to implement the business logic for a specific feature or functionality of the API. The domain is responsible for handling the core business logic and should be independent from the HTTP layer, so it's important to follow the project styleguide to ensure consistency and maintainability.

## How to use

When asked to add or edit any domain:

1. Create a new file in the `domains/(domain)/usecase.ts` directory with the name of the domain if it's necessary (e.g., `domains/offers/usecase.ts`).
2. Create a typescript class if it's necessary with the name of the domain, in PascalCase (e.g., `Offer`).
3. Add a method to the class that will handle the business logic, in camelCase (e.g., `getOffers`).
4. The domain must not have any dependency on the Request/Responses objects.
5. The domain can interact with repositories to get or save data, but it should not know anything about the repository logic.
6. The domain can interact with external services if necessary, but it should handle any necessary validation and error handling.

### Template

```typescript
import { OffersNotFoundError } from "../models/offers/errors";

class Offer {
  async getOffers(id: number) {
    try {
      // Call any repository to get data
      const offers = await anyRepository.getOffers(id);

      // Return a not found response if the offers are not found
      if (!offers) {
        throw new OffersNotFoundError();
      }

      // Return a clean object
      return offers;
    } catch (error) {
      // Throw the error to be handled by the handler
      throw error;
    }
  }
}
```
