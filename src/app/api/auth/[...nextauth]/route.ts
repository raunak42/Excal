import NextAuth from "next-auth";
import type { NextRequest } from "next/server";

import { createAuthOptions } from "@/lib/auth-options";

const handler = async (
  request: NextRequest,
  context: { params: Promise<{ nextauth: string[] }> },
) => {
  const authHandler = NextAuth(createAuthOptions());
  return authHandler(request, context);
};

export { handler as GET, handler as POST };
