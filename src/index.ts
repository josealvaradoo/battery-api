import { Hono } from "hono";
import { cors } from "hono/cors";
import { poweredBy } from "hono/powered-by";
import { logger as honoLogger } from "hono/logger";
import { status } from "./handlers/status";
import { auth } from "./handlers/auth";
import { timeout } from "hono/timeout";
import { authenticate } from "./middlewares/auth-router";
import { logger } from "./helpers";

const app = new Hono();

// Register first so hono/logger observes every request, including 401s from
// authenticate and timeouts from timeout.
app.use(honoLogger());
app.use(poweredBy());
app.use(timeout(30000));
app.use("*", cors());
app.use("/status/*", authenticate);

// Health check
app.get("/", ({ json }) => json({ data: "ok" }, 200));

app.route("/auth", auth);
app.route("/status", status);

logger.info("Starting app...");

export default app;
