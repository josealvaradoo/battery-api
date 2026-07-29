import { describe, test, expect, mock, beforeAll, beforeEach } from "bun:test";
import { sign } from "hono/jwt";
import type { JWTUser } from "../lib/user/type";

/* ---------- Environment ---------- */

process.env.JWT_SECRET = "test-secret";

/* ---------- Mocks ---------- */

const mockUser: JWTUser = {
  name: "Test User",
  email: "test@example.com",
  email_verified: true,
  picture: "https://example.com/pic.png",
};

const mockSignIn = mock((): Promise<string> => Promise.resolve("jwt-token"));
const mockSignInWithGoogle = mock(
  (): Promise<string> => Promise.resolve("google-jwt-token"),
);
const mockRevokeGoogleSession = mock(
  (): Promise<boolean> => Promise.resolve(true),
);
const mockGetUserFromToken = mock(
  (): Promise<JWTUser | null> => Promise.resolve(mockUser),
);

mock.module("../services/auth.service", () => ({
  default: {
    signIn: mockSignIn,
    signInWithGoogle: mockSignInWithGoogle,
    revokeGoogleSession: mockRevokeGoogleSession,
    getUserFromToken: mockGetUserFromToken,
  },
}));

/* ---------- Import handler after mocks ---------- */

import { auth } from "./auth";

/* ---------- Helpers ---------- */

const createTestToken = async (): Promise<string> => {
  return sign(
    {
      sub: "test-user",
      user: mockUser,
      exp: Math.floor(Date.now() / 1000) + 3600,
    },
    process.env.JWT_SECRET!,
  );
};

/* ---------- Tests ---------- */

describe("POST / (deprecated)", () => {
  beforeEach(() => {
    mockSignIn.mockClear();
    mockSignIn.mockResolvedValue("jwt-token");
  });

  test("returns a JWT on valid credentials", async () => {
    const res = await auth.request("/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "admin", password: "secret" }),
    });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.token).toBe("jwt-token");
    expect(mockSignIn).toHaveBeenCalledWith("admin", "secret");
  });

  test("returns 401 on invalid credentials", async () => {
    mockSignIn.mockRejectedValueOnce(new Error("Invalid credentials"));

    const res = await auth.request("/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "wrong", password: "wrong" }),
    });
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe("Invalid credentials");
  });
});

describe("POST /google", () => {
  beforeEach(() => {
    mockSignInWithGoogle.mockClear();
    mockSignInWithGoogle.mockResolvedValue("google-jwt-token");
  });

  test("returns a JWT on valid Google token", async () => {
    const res = await auth.request("/google", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: "valid-google-token" }),
    });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.token).toBe("google-jwt-token");
    expect(mockSignInWithGoogle).toHaveBeenCalledWith("valid-google-token");
  });

  test("returns 401 when token is missing from body", async () => {
    const res = await auth.request("/google", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe("a token is required");
  });

  test("returns 401 on service error", async () => {
    mockSignInWithGoogle.mockRejectedValueOnce(
      new Error("User is not in whitelist"),
    );

    const res = await auth.request("/google", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: "invalid-google-token" }),
    });
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe("User is not in whitelist");
  });
});

describe("POST /google/revoke", () => {
  beforeEach(() => {
    mockRevokeGoogleSession.mockClear();
    mockRevokeGoogleSession.mockResolvedValue(true);
  });

  test("returns success true on valid token", async () => {
    const res = await auth.request("/google/revoke", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: "valid-google-token" }),
    });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(mockRevokeGoogleSession).toHaveBeenCalledWith("valid-google-token");
  });

  test("returns 500 on service error", async () => {
    mockRevokeGoogleSession.mockRejectedValueOnce(new Error("Revoke failed"));

    const res = await auth.request("/google/revoke", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: "some-token" }),
    });
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body).toHaveProperty("error");
  });
});

describe("GET /verify", () => {
  test("returns 200 and data when authenticated with valid JWT", async () => {
    const token = await createTestToken();
    const res = await auth.request("/verify", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data).toBe("authenticated");
  });

  test("returns 401 when no Authorization header is provided", async () => {
    const res = await auth.request("/verify");
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe("token is not provided");
  });

  test("returns 401 when token is invalid", async () => {
    const res = await auth.request("/verify", {
      headers: { Authorization: "Bearer invalid-token" },
    });
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe("invalid token");
  });
});

describe("GET /profile", () => {
  beforeEach(() => {
    mockGetUserFromToken.mockClear();
    mockGetUserFromToken.mockResolvedValue(mockUser);
  });

  test("returns user data when authenticated", async () => {
    const token = await createTestToken();
    const res = await auth.request("/profile", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data).toEqual(mockUser);
  });

  test("returns 500 when getUserFromToken throws", async () => {
    const token = await createTestToken();
    mockGetUserFromToken.mockRejectedValueOnce(new Error("Token error"));

    const res = await auth.request("/profile", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body).toHaveProperty("error");
  });

  test("returns 401 when no Authorization header is provided", async () => {
    const res = await auth.request("/profile");
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe("token is not provided");
  });
});
