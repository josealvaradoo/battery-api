import { Hono } from "hono";
import { poweredBy } from "hono/powered-by";
import { status } from "./handlers/status";

const app = new Hono();

app.use(poweredBy());

// Health check
app.get("/", (c) => {
  c.status(200);
  return c.html("Server is ok!");
});

app.route("/status", status);

export default app;
