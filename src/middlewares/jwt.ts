import { Context, Next } from "hono";
import { verify } from "hono/jwt";

class CustomJwtError extends Error {}

export const authenticated = async (c: Context, next: Next) => {
  try {
    const authorization = c.req.header("Authorization");
    const token = authorization?.replace("Bearer ", "");

    if (!authorization || !token) {
      throw new CustomJwtError("token is not provided");
    }

    const payload = await verify(token, process.env.JWT_SECRET!);

    if (payload.exp! < Date.now() / 1000) {
      throw new CustomJwtError("token is expired");
    }

    return next();
  } catch (error) {
    if (error instanceof CustomJwtError) {
      return c.json({ error: error.message }, 401);
    }

    return c.json({ error: "invalid token" }, 401);
  }
};
