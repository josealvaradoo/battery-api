import { Hono } from "hono";
import AuthService, {
  UserNotFoundError,
  InvalidCredentialsError,
} from "../services/auth.service";

const auth = new Hono();

auth.post("/", async (c) => {
  const body = await c.req.json();
  try {
    const { username, password } = AuthService.login(
      body.username,
      body.password,
    );

    return c.json({ data: { username, password } }, 200);
  } catch (error) {
    if (
      error instanceof UserNotFoundError ||
      error instanceof InvalidCredentialsError
    ) {
      return c.json({ error: error.message }, 401);
    }
    return c.json({ error: (error as Error).message }, 500);
  }
});

export { auth };
