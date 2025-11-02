import type { User, JWTUser } from "../lib/user/type";
import { OAuth2Client } from "google-auth-library";
import { getUserFromJWT, signJWT } from "../helpers/jwt.helper";

export class UserNotFoundError extends Error {}
export class InvalidCredentialsError extends Error {}
export class InvalidSession extends Error {}

const client = new OAuth2Client(process.env.OAUTH_GOOGLE_CLIENT_ID!);

type Username = User["username"];
type Password = User["password"];

class AuthService {
  /**
   * Authenticates a user using username and password credentials
   * @deprecated This method is deprecated. Use signInWithGoogle instead for OAuth authentication.
   * @param {string} username - The username for authentication
   * @param {string} password - The password for authentication
   * @returns {Promise<string>} A JWT token for the authenticated user
   * @throws {InvalidCredentialsError} When credentials are invalid or user not found
   */
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

  /**
   * Authenticates a user using Google OAuth ID token
   * @param {string} idToken - The Google OAuth ID token to verify
   * @returns {Promise<string>} A JWT token for the authenticated user
   * @throws {Error} When token verification fails or payload is invalid
   * @throws {InvalidCredentialsError} When user email is not in the whitelist
   */
  public async signInWithGoogle(idToken: string): Promise<string> {
    const ticket = await client.verifyIdToken({
      idToken: idToken,
    });

    const data = ticket.getPayload();

    if (!data || !data.email) {
      throw new Error();
    }

    const whitelist = process.env.GOOGLE_EMAILS_WHITELIST?.split(",") || [];
    if (!whitelist.includes(data.email)) {
      throw new InvalidCredentialsError("User is not in whitelist");
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

  /**
   * Revokes a Google OAuth session token
   * @param {string} token - The Google OAuth token to revoke
   * @returns {Promise<boolean>} True if the token was successfully revoked
   * @throws {InvalidSession} When token revocation fails
   */
  public async revokeGoogleSession(token: string): Promise<boolean> {
    try {
      await client.revokeToken(token);
      return true;
    } catch (error) {
      console.error("Failed to revoke Google session:", error);
      throw new InvalidSession("Failed to revoke Google session");
    }
  }

  /**
   * Retrieves user information from a JWT token
   * @param {string} token - The JWT token to decode and extract user information from
   * @returns {Promise<JWTUser | null>} The user object if token is valid, null otherwise
   * @throws {Error} When token is not provided
   */
  public async getUserFromToken(token: string): Promise<JWTUser | null> {
    if (!token) {
      throw new Error("token is required");
    }

    return getUserFromJWT(token);
  }
}

export default new AuthService();
