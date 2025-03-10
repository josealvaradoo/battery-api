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
    if (!token) {
      throw new Error("a token is required");
    }

    return c.json({ token: await AuthService.signInWithGoogle(token) }, 200);
  } catch (error) {
    console.error(error);
    if (error instanceof Error) {
      return c.json({ error: error.message }, 401);
    }

    return c.json({ error: "Invalid token" }, 401);
  }
});

auth.post("/google/revoke", async (c: Context) => {
  const { token } = await c.req.json();
  try {
    return c.json(
      { success: await AuthService.revokeGoogleSession(token) },
      200,
    );
  } catch (error) {
    console.error(error);
    return c.json({ error: error }, 500);
  }
});

auth.get("/verify", authenticated, async (c: Context) => {
  return c.json({ data: "authenticated" }, 200);
});

auth.get("/profile", authenticated, async (c: Context) => {
  try {
    const authorization = c.req.header("Authorization");
    const token = authorization?.replace("Bearer ", "");
    const user = await AuthService.getUserFromToken(token!);

    return c.json({ data: user }, 200);
  } catch (error) {
    console.error(error);
    return c.json({ error: error }, 500);
  }
});

export { auth };
