import { NextResponse } from "next/server";
import { supabaseFetch } from "@/lib/supabase";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "bmkg-jatim-super-secret-key-123!");

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ error: "Username and password required" }, { status: 400 });
    }

    // Since we fetch from REST API, we can't easily filter by text exact match if RLS is off, but we can try exact match
    const users = await supabaseFetch("admin_users", `username=eq.${username}`);
    
    if (!users || users.length === 0) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const user = users[0];

    // Verify password
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // Generate JWT
    const token = await new SignJWT({
      username: user.username,
      role: user.role,
      display_name: user.display_name
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('24h')
      .sign(JWT_SECRET);

    return NextResponse.json({ 
      token, 
      user: {
        username: user.username,
        role: user.role,
        display_name: user.display_name
      }
    });

  } catch (error: any) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
