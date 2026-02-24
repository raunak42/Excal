import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      githubId?: number;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    githubId?: number;
  }
}
