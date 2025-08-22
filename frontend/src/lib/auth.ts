import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { getDb } from "@/lib/mongodb";

function getOwnerEmails(): string[] {
  const raw = process.env.OWNER_EMAILS || "";
  return raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter((e) => e.length > 0);
}

export const authOptions: NextAuthOptions = {
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        role: { label: "Role", type: "text" }, // owner | worker
      },
      async authorize(credentials) {
        const email = (credentials?.email || "").toString().toLowerCase();
        const password = (credentials?.password || "").toString();
        const requestedRole = (credentials?.role || "worker").toString();

        try {
          const db = await getDb();
          const users = db.collection<{ _id: any; email: string; password: string; role: string }>("users");
          const user = await users.findOne({ email });
          if (!user) return null;
          const ok = await bcrypt.compare(password, user.password || "");
          if (!ok) return null;
          if (requestedRole && requestedRole !== user.role) return null;
          return { id: String(user._id), email: user.email, role: user.role } as any;
        } catch (e) {
          return null;
        }
      },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        const userRole = (user as any).role as string | undefined;
        if (userRole === "owner" || userRole === "worker") {
          token.role = userRole;
        }
        if (!userRole && account?.provider === "google") {
          const ownerEmails = getOwnerEmails();
          const email = (user.email || "").toLowerCase();
          token.role = ownerEmails.includes(email) ? "owner" : "worker";
        }
      }
      return token as any;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = (token as any).role ?? "worker";
      }
      return session;
    },
  },
};
