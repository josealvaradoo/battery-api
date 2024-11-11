import { Hono } from "hono";
import type { Battery } from "../lib/battery/type";
import Memory from "../helpers/memory";
import BatteryService from "../services/battery.service";
import { streamSSE } from "hono/streaming";

const status = new Hono();

// Get battery status by HTTP
status.get("/", async (c) => {
  try {
    let data: Battery;
    let isCached = false;
    const { cache } = c.req.query();

    // First, check if exista a previous cached value in memory
    const memory = Memory.getInstance();
    const cachedValue = memory.get<Battery>("battery");

    // If cache value is not found or is expired, run the service
    // but else, return the cached value
    if (cache === "false" || !cachedValue) {
      const batteryService = new BatteryService();
      data = await batteryService.run();
      Memory.getInstance().set<Battery>("battery", data);
    } else {
      data = cachedValue;
      isCached = true;
    }

    c.status(200);
    return c.json({ data, is_cached: isCached });
  } catch (error) {
    c.status(500);
    return c.json({ error: (error as Error).message });
  }
});

// Refresh battery status on cache thought HTTP
status.post("/refresh", async (c) => {
  try {
    const batteryService = new BatteryService();
    const status: Battery = await batteryService.run();

    Memory.getInstance().set<Battery>("battery", status);

    c.status(200);
    return c.json({
      data: true,
    });
  } catch (error) {
    c.status(500);
    return c.json({ error: (error as Error).message });
  }
});

// Stream battery status. First send the cached value, then the live value
status.get("/stream", async (c) => {
  return streamSSE(c, async (stream) => {
    try {
      let data: Battery;
      c.req.query();

      // First, check if exista a previous cached value in memory
      const memory = Memory.getInstance();
      const cachedValue = memory.get<Battery>("battery");

      if (cachedValue) {
        await stream.writeSSE({
          data: JSON.stringify({
            data: cachedValue,
            is_cached: true,
          }),
        });
      }

      const batteryService = new BatteryService();
      data = await batteryService.run();
      Memory.getInstance().set<Battery>("battery", data);

      await stream.sleep(3000);

      await stream.writeSSE({
        data: JSON.stringify({
          data: cachedValue,
          is_cached: false,
        }),
      });
    } catch (error) {
      console.error(error);
    }
  });
});

export { status };
