import { Hono } from "hono";
import type { Battery } from "../lib/battery/type";
import Memory from "../helpers/memory";
import BatteryService from "../services/battery.service";
import { streamSSE } from "hono/streaming";
import retry from "../helpers/retry.helper";

const status = new Hono();

// Get battery status by HTTP
status.get("/", async (c) => {
  try {
    let data: Battery;
    let isCached = false;
    const { cache } = c.req.query();

    // First, check whether exists a previous cached value in memory
    const memory = Memory.getInstance();
    const cachedValue = memory.get<Battery>("battery");

    // If cache value is not found or is expired, run the service
    // but else, return the cached value
    if (cache === "false" || !cachedValue) {
      data = await retry(BatteryService.run.bind(BatteryService), 3);
      Memory.getInstance().set<Battery>("battery", data);
    } else {
      data = cachedValue;
      isCached = true;
    }

    return c.json({ data, is_cached: isCached }, 200);
  } catch (error) {
    return c.json({ error: (error as Error).message }, 500);
  }
});

// Refresh battery status on cache thought HTTP
status.post("/refresh", async (c) => {
  try {
    const status: Battery = await BatteryService.run();

    Memory.getInstance().set<Battery>("battery", status);

    return c.json({ data: true }, 200);
  } catch (error) {
    return c.json({ error: (error as Error).message }, 500);
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

      data = await BatteryService.run();
      Memory.getInstance().set<Battery>("battery", data);

      await stream.sleep(2000);

      await stream.writeSSE({
        data: JSON.stringify({
          data: data,
          is_cached: false,
        }),
      });
    } catch (error) {
      console.error(error);
    }
  });
});

export { status };
