import { sign } from "hono/jwt";
import type { User } from "../lib/user/type";

export class UserNotFoundError extends Error {}
export class InvalidCredentialsError extends Error {}
export class InvalidSession extends Error {}

type Username = User["username"];
type Password = User["password"];

class AuthService {
  public async login(username: Username, password: Password): Promise<string> {
    if (username != process.env.AUTH_USER) {
      console.error("Invalid user");
      throw new UserNotFoundError("User not found");
    }

    if (password != atob(process.env.AUTH_PASS!)) {
      console.error("Invalid password");
      throw new InvalidCredentialsError("Invalid credentials");
    }

    const payload = {
      sub: btoa(username) + "@" + btoa(password),
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30, // Token expires in 30 days
    };
    const token = await sign(payload, process.env.JWT_SECRET!);

    return token;
  }
}

export default new AuthService();
