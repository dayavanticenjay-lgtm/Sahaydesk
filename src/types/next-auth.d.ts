import type { DefaultSession } from "next-auth";
import type { Role } from "@/generated/prisma/enums";

declare module "next-auth" {
  interface User {
    role: Role;
    isAiAgent: boolean;
  }

  interface Session {
    user: {
      id: string;
      role: Role;
      isAiAgent: boolean;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: Role;
    isAiAgent: boolean;
  }
}
