import { Context, Hono } from "hono";
import AuthService from "../services/auth.service";
import { authenticated } from "../middlewares/jwt";

const auth = new Hono();

auth.post("", async (c: Context) => {
  try {
    const { username, password } = await c.req.json();

    return c.json({ token: await AuthService.signIn(username, password) }, 200);
  } catch (error) {
    if (error instanceof Error) {
      return c.json({ error: error.message }, 401);
    }

    return c.json({ error: (error as Error).message }, 500);
  }
});

auth.post("/google", async (c: Context) => {
  const { token } = await c.req.json();
  try {
    return c.json({ token: await AuthService.signInWithGoogle(token) }, 200);
  } catch (error) {
    if (error instanceof Error) {
      return c.json({ error: error.message }, 401);
    }

    return c.json({ error: "Invalid token" }, 401);
  }
});

auth.get("/verify", authenticated, async (c: Context) => {
  return c.json({ data: "authenticated" }, 200);
});

export { auth };
