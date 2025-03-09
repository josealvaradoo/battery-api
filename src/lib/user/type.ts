export type User = {
  username: string;
  password: string;
};

export type JWTUser = {
  name: string;
  email: string;
  email_verified: boolean;
  picture: string;
};
