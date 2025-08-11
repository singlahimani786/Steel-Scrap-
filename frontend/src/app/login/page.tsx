// app/login/page.tsx
'use client';

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";

export default function LoginPage() {
    const searchParams = useSearchParams();
    const callbackUrl =searchParams.get("callbackUrl") || "/dashboard";
  return (
    <div>
      <h1>Login Required</h1>
      <button onClick={() => signIn("google",{callbackUrl})}>Sign in with Google</button>
    </div>
  );
}