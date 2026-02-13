import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface User {
    id?: string;
    role?: "admin" | "organizer" | "parent";
  }
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      image?: string | null;
      role: "admin" | "organizer" | "parent";
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: "admin" | "organizer" | "parent";
    image?: string | null;
  }
}
