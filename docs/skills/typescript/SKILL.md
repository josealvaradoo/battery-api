---
name: typescript
description: Define how to write a good typescript code.
---

# Web Scraping Skill

Define rules for writing a well and clean typescript code following the best practices.

## When to use

Use this skill when you need write code using typescript.

## How to use

When asked to edit code or write new code:

1. Never use `any`.
2. Create `type` or `interface` when it's necessary.
3. Type every function structures: arguments and returns.
4. Don't repeat yourself. Do use union `|`, interceptions `&`, extensions `extends`, picks `Pick<>`, omits `Omit<>`, etc...

### Examples

```typescript
// A bad code
const foo = (arg: any) => {};

// A good code
interface FooArg {
  name: string;
}
const foo = (arg: FooArg): void => {};
```

```typescript
// A bad code
type User = { name: string };
type Admin = { name: string; role: string };

// A good code
type User = { name: string };
type Admin = User & { role: string };
```

```typescript
// A bad code
type SuperAdmin = { name: string; role: string; power: boolean };
type Admin = { name: string; role: string };

// A good code
type SuperAdmin = { name: string; role: string; power: boolean };
type Admin = Omit<SuperAdmin, "power">;
```
