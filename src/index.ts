import { Hono } from "hono";
import { poweredBy } from "hono/powered-by";
import { status } from "./handlers/status";
import { auth } from "./handlers/auth";
import { timeout } from "hono/timeout";

const app = new Hono();

app.use(poweredBy());
app.use(timeout(30000));

// Health check
app.get("/", (c) => {
  c.status(200);
  return c.html("Server is ok!");
});

app.route("/auth", auth);
app.route("/status", status);

export default app;
