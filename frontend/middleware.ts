// middleware.ts
import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/login",
  },
});

export const config = {
  // Protect dashboard only; allow marketing pages unauthenticated
  matcher: ["/dashboard/:path*"],
};