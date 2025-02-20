import { Hono } from "hono";
import { cors } from "hono/cors";
import { poweredBy } from "hono/powered-by";
import { status } from "./handlers/status";
import { auth } from "./handlers/auth";
import { timeout } from "hono/timeout";

const app = new Hono();

app.use(poweredBy());
app.use(timeout(30000));
app.use("*", cors());

// Health check
app.get("/", (c) => {
  return c.html("Server is ok!", 200);
});

app.route("/auth", auth);
app.route("/status", status);

export default app;
