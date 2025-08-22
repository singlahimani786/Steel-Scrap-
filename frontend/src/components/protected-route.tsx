'use client';

import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'owner' | 'labourer' | ('admin' | 'owner' | 'labourer')[];
}

export default function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
    
    if (!isLoading && user && requiredRole) {
      if (Array.isArray(requiredRole)) {
        // Check if user role is in the allowed roles array
        if (!requiredRole.includes(user.role)) {
          router.push('/');
        }
      } else {
        // Single role check
        if (user.role !== requiredRole) {
          router.push('/');
        }
      }
    }
  }, [user, isLoading, requiredRole, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to login
  }

  if (requiredRole) {
    if (Array.isArray(requiredRole)) {
      // Check if user role is in the allowed roles array
      if (!requiredRole.includes(user.role)) {
        return null; // Will redirect to dashboard
      }
    } else {
      // Single role check
      if (user.role !== requiredRole) {
        return null; // Will redirect to dashboard
      }
    }
  }

  return <>{children}</>;
}

