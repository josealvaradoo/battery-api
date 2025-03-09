import type { User, JWTUser } from "../lib/user/type";
import { OAuth2Client } from "google-auth-library";
import { signJWT } from "../helpers/jwt.helper";

export class UserNotFoundError extends Error {}
export class InvalidCredentialsError extends Error {}
export class InvalidSession extends Error {}

const client = new OAuth2Client(process.env.OAUTH_GOOGLE_CLIENT_ID!);

type Username = User["username"];
type Password = User["password"];

class AuthService {
  public async signIn(username: Username, password: Password): Promise<string> {
    if (username != process.env.AUTH_USER) {
      console.error("Invalid user");
      throw new UserNotFoundError("User not found");
    }

    if (password != atob(process.env.AUTH_PASS!)) {
      console.error("Invalid password");
      throw new InvalidCredentialsError("Invalid credentials");
    }

    return signJWT({
      sub: btoa(username),
      user: {
        name: process.env.SUPER_ADMIN_NAME,
        email: process.env.SUPER_ADMIN_EMAIL,
        email_verified: true,
        picture: process.env.SUPER_ADMIN_PICTURE,
      } as JWTUser,
    });
  }

  public async signInWithGoogle(idToken: string): Promise<string> {
    const ticket = await client.verifyIdToken({
      idToken: idToken,
    });

    const data = ticket.getPayload();

    if (!data) {
      throw new Error();
    }

    return signJWT({
      sub: data.sub,
      user: {
        email: data.email,
        name: data.name,
        picture: data.picture,
        email_verified: data.email_verified,
      } as JWTUser,
    });
  }

  public async revokeGoogleSession(token: string): Promise<boolean> {
    try {
      await client.revokeToken(token);
      return true;
    } catch (error) {
      console.error("Failed to revoke Google session:", error);
      throw new InvalidSession("Failed to revoke Google session");
    }
  }
}

export default new AuthService();
