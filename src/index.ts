import { Hono } from "hono";
import { cors } from "hono/cors";
import { poweredBy } from "hono/powered-by";
import { logger as honoLogger } from "hono/logger";
import { status } from "./handlers/status";
import { auth } from "./handlers/auth";
import { alexa } from "./handlers/alexa";
import { timeout } from "hono/timeout";
import { authenticate } from "./middlewares/auth-router";
import { alexaAuth } from "./middlewares/alexa-auth";
import { logger } from "./helpers";

const app = new Hono();

// Register first so hono/logger observes every request, including 401s from
// authenticate and timeouts from timeout.
app.use(honoLogger());
app.use(poweredBy());
app.use(timeout(30000));
app.use("*", cors());
app.use("/status/*", authenticate);
// alexaAuth must run after cors() and timeout() so those still apply to
// /alexa requests. It reads the JSON body via c.req.json(), which Hono caches,
// so the handler can read the same body again without consuming the stream.
// The middleware matches only the exact /alexa path (POST /alexa), leaving the
// public GET /alexa/privacy and GET /alexa/terms policy documents unauthenticated.
app.use("/alexa", alexaAuth);

// Health check
app.get("/", ({ json }) => json({ data: "ok" }, 200));

app.route("/auth", auth);
app.route("/status", status);
app.route("/alexa", alexa);

logger.info("Starting app...");

export default app;
