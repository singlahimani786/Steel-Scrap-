import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import bcrypt from "bcryptjs";

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = (body?.email || "").toLowerCase().trim();
    const password = (body?.password || "").toString();
    const role = ((body?.role as string) || "worker").toLowerCase();

    if (!email || !password) {
      return NextResponse.json({ status: "error", message: "Email and password required" }, { status: 400 });
    }

    const db = await getDb();
    const users = db.collection("users");
    const user = await users.findOne<{ _id: any; email: string; password: string; role: string }>({ email });
    if (!user) {
      return NextResponse.json({ status: "error", message: "Invalid credentials" }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, user.password || "");
    if (!valid) {
      return NextResponse.json({ status: "error", message: "Invalid credentials" }, { status: 401 });
    }

    if (role && role !== user.role) {
      return NextResponse.json({ status: "error", message: "Role mismatch" }, { status: 403 });
    }

    return NextResponse.json({
      status: "success",
      user: { id: user._id.toString(), email: user.email, role: user.role },
    });
  } catch (e: any) {
    return NextResponse.json({ status: "error", message: e?.message || "Unknown error" }, { status: 500 });
  }
}


