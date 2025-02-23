import type { User } from "../lib/user/type";

export class UserNotFoundError extends Error {}
export class InvalidCredentialsError extends Error {}

type Username = User["username"];
type Password = User["password"];

class AuthService {
  public login(username: Username, password: Password): User {
    if (username != process.env.AUTH_USER) {
      console.error("Invalid user");
      throw new UserNotFoundError("User not found");
    }

    if (password != atob(process.env.AUTH_PASS!)) {
      console.error("Invalid password");
      throw new InvalidCredentialsError("Invalid credentials");
    }

    return { username, password: btoa(password) };
  }
}

export default new AuthService();
