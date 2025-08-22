import NextAuth, { DefaultSession } from "next-auth";

// Define the user types
interface UserBase {
  id: string;
  email: string;
  role: 'admin' | 'owner' | 'labourer';
}

interface AdminUser extends UserBase {
  role: 'admin';
}

interface OwnerUser extends UserBase {
  role: 'owner';
  factory_id: string;
}

interface LabourerUser extends UserBase {
  role: 'labourer';
  factory_id: string;
  owner_id: string;
}

export type User = AdminUser | OwnerUser | LabourerUser;

declare module "next-auth" {
  interface Session {
    user: User & DefaultSession["user"]
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    email: string;
    role: string;
    factory_id?: string;
    owner_id?: string;
  }
}

