// middleware.ts
import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/login", // Redirect if not signed in
  },
});

export const config = {
  matcher: ["/((?!api|_next|static|favicon.ico).*)"], // matches everything except static/API
};