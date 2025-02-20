export class UserNotFoundError extends Error {}
export class InvalidCredentialsError extends Error {}

class AuthService {
  public login(email: string, password: string) {
    if (email != process.env.AUTH_USER) {
      console.error("Invalid user");
      throw new UserNotFoundError("User not found");
    }

    if (password != atob(process.env.AUTH_PASS!)) {
      console.error("Invalid password");
      throw new InvalidCredentialsError("Invalid credentials");
    }

    console.info("User logged in");
    return { email, password: btoa(password) };
  }
}

export default new AuthService();
