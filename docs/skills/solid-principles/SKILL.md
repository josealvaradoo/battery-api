---
name: solid-principles
description: Define how to write code following the SOLID principles.
---

# SOLID Skill

Define the SOLID principle to write clean code.

## When to use

Use this skill when you need write clean code following the SOLID principles.

## How to use

This Agent SKILL is to define the best practices about SOLID principles to write clean code. The SOLID principle is:

1. (S) Single Responsability Principle - SRP: Which define every function, class, domain, etc must have only one reason to change, meaning it should have a single job or responsibility.. So, every element of the code should be short and concise.
2. (O) Open-Close Responsability - OCR: Software entities (classes, modules, functions) should be open for extension but closed for modification.
3. (L) Liskov Substitution Principle - LSP: Subtypes must be substitutable for their base types without altering the correctness of the program
4. (I) Interface Segregation Principle - ISP: Clients should not be forced to depend upon interfaces they do not use; many specific interfaces are better than one general-purpose interface.
5. (D) Dependency Inversion Principle - DIP: Depend upon abstractions, not concretions; high-level modules should not depend on low-level modules.

### Examples

- Single Responsability Principle:

```typescript
// BAD
class UserService {
  async createUser(data: any) {
    // validate
    if (!data.email) throw new Error("Invalid email");

    // persist
    await db.insert("users", data);

    // notify
    await sendEmail(data.email);
  }
}

// GOOD
class UserValidator {
  validate(data: any) {
    if (!data.email) throw new Error("Invalid email");
  }
}

class UserRepository {
  save(data: any) {
    return db.insert("users", data);
  }
}

class UserService {
  constructor(
    private validator: UserValidator,
    private repo: UserRepository,
  ) {}

  async createUser(data: any) {
    this.validator.validate(data);
    await this.repo.save(data);
  }
}
```

- Open-Closed Principle:

```typescript
// BAD
function getDiscount(type: string) {
  if (type === "vip") return 0.2;
  if (type === "regular") return 0.1;
  return 0;
}

// GOOD
interface DiscountStrategy {
  apply(): number;
}

class VipDiscount implements DiscountStrategy {
  apply() {
    return 0.2;
  }
}

class RegularDiscount implements DiscountStrategy {
  apply() {
    return 0.1;
  }
}
```

- Liskov Substitution Principle:

```typescript
// BAD
class FileStorage {
  save(data: string) {}
}

class ReadOnlyStorage extends FileStorage {
  save() {
    throw new Error("Not allowed");
  }
}

// GOOD
interface ReadableStorage {
  read(): string;
}

interface WritableStorage {
  save(data: string): void;
}

class FileStorage implements ReadableStorage, WritableStorage {
  read() {
    return "";
  }
  save(data: string) {}
}
```

- Interface Segregation Principle:

```typescript
// BAD
interface UserActions {
  create(): void;
  update(): void;
  delete(): void;
}

class ReadOnlyUser implements UserActions {
  create() {}
  update() {}
  delete() {}
}

// GOOD
interface Creatable {
  create(): void;
}

interface Updatable {
  update(): void;
}

class AdminUser implements Creatable, Updatable {
  create() {}
  update() {}
}
```

- Dependency Inversion Principle:

```typescript
// BAD
class UserController {
  private service = new UserService();

  async handle(c: Context) {
    return c.json(await this.service.createUser(c.req.json()));
  }
}

// GOOD
interface UserServicePort {
  createUser(data: any): Promise<void>;
}

class UserController {
  constructor(private service: UserServicePort) {}

  async handle(c: Context) {
    await this.service.createUser(await c.req.json());
    return c.json({ ok: true });
  }
}
```
