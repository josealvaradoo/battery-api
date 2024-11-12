type Struct = Record<string, { value: unknown; expires: number }>;
type Value = string | number;

const TTL = process.env.CACHE_TTL ? +process.env.CACHE_TTL : 300;

export default class Memory {
  private data: Struct;
  private static _instance: Memory;

  private constructor() {
    this.data = {};
  }

  public static getInstance(): Memory {
    if (!Memory._instance) {
      Memory._instance = new Memory();
    }

    return Memory._instance;
  }

  public set<T = Value>(key: string, value: T): void {
    // Set the key and its expiration time
    this.data[key] = {
      value,
      expires: Date.now() + TTL * 1000,
    };
  }

  public get<T = Value>(key: string): T | null {
    try {
      const value = this.data[key]?.value as T ?? null;

      // Check if the key exists and if it's still valid
      if (this.data[key].expires < Date.now()) {
        this.delete(key);
      }

      return value;
    } catch (error) {
      return null;
    }
  }

  public delete(key: string): void {
    delete this.data[key];
  }
}
