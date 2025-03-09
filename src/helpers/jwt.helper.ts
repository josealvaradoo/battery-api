import { sign } from "hono/jwt";
import { JWTUser } from "../lib/user/type";

type Payload = {
  sub: string | number;
  user: JWTUser;
};

const A_MONTH_IN_SECONDS = 60 * 60 * 24 * 30;

export const signJWT = async (payload: Payload): Promise<string> => {
  return sign(
    {
      sub: payload.sub,
      user: payload.user,
      exp: Date.now() / 1000 + A_MONTH_IN_SECONDS,
    },
    process.env.JWT_SECRET!,
  );
};
