import { Context, Next } from "hono";
import { authenticated } from "./jwt";
import { apiKeyAuth } from "./api-key";

export const authenticate = async (c: Context, next: Next) => {
  const apiKey = c.req.header("x-api-key");
  const authorization = c.req.header("Authorization");

  if (apiKey) {
    return apiKeyAuth(c, next);
  }

  if (authorization) {
    return authenticated(c, next);
  }

  return c.json({ error: "authentication is required" }, 401);
};