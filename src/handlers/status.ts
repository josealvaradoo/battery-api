import { Hono } from "hono";
import type { Battery } from "../lib/battery/type";
import Memory from "../helpers/memory";
import retry from "../helpers/retry.helper";
import GrowattService from "../services/growatt.service";

const MEMORY_KEY = "battery";
const status = new Hono();

// Get battery status by HTTP
status.get("/", async (c) => {
  try {
    let data: Battery;
    let isCached = false;
    const { cache } = c.req.query();

    // First, check whether exists a previous cached value in memory
    const memory = Memory.getInstance();
    const cachedValue = memory.get<Battery>(MEMORY_KEY);

    // If cache value is not found or is expired, run the service
    // but else, return the cached value
    if (cache === "false" || !cachedValue) {
      data = await retry(GrowattService.get, 3, 5);
      Memory.getInstance().set<Battery>(MEMORY_KEY, data);
    } else {
      data = cachedValue;
      isCached = true;
    }

    return c.json({ data, is_cached: isCached }, 200);
  } catch (error) {
    return c.json({ error: (error as Error).message }, 500);
  }
});

export { status };
