import { NextResponse } from "next/server";
import { supabaseInsert } from "@/lib/supabase";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { username, password, role, display_name } = await req.json();

    if (!username || !password || !display_name) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (username.toLowerCase() === "develop") {
      return NextResponse.json({ error: "Username 'Develop' tidak diizinkan." }, { status: 400 });
    }

    const password_hash = await bcrypt.hash(password, 10);
    
    // Explicitly prevent creating developer role via regular register
    const userRole = role === "super_admin" ? "super_admin" : "admin";

    const res = await supabaseInsert("admin_users", {
      username,
      password_hash,
      role: userRole,
      display_name
    });

    if (!res) {
      return NextResponse.json({ error: "Failed to create user. Username might exist." }, { status: 400 });
    }

    return NextResponse.json({ message: "User created successfully" });

  } catch (error: any) {
    console.error("Register error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
