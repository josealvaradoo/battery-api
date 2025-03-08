import { Hono } from "hono";
import AuthService, { InvalidCredentialsError } from "../services/auth.service";

const auth = new Hono();

auth.post("", async (c) => {
  try {
    const { username, password } = await c.req.json();

    const token = await AuthService.login(username, password);

    return c.json({ token }, 200);
  } catch (error) {
    if (error instanceof InvalidCredentialsError) {
      return c.json({ error: error.message }, 401);
    }
    return c.json({ error: (error as Error).message }, 500);
  }
});

export { auth };
