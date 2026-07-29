import { Hono } from "hono";
import { cors } from "hono/cors";
import { poweredBy } from "hono/powered-by";
import { status } from "./handlers/status";
import { auth } from "./handlers/auth";
import { timeout } from "hono/timeout";
import { authenticate } from "./middlewares/auth-router";

const app = new Hono();

app.use(poweredBy());
app.use(timeout(30000));
app.use("*", cors());
app.use("/status/*", authenticate);

// Health check
app.get("/", ({ json }) => json({ data: "ok" }, 200));

app.route("/auth", auth);
app.route("/status", status);

console.log("Starting app...");

export default app;
