import { NextResponse } from "next/server";
import { jwtVerify, SignJWT } from "jose";
import { supabaseFetch, supabaseUpdate } from "@/lib/supabase";
import bcrypt from "bcryptjs";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "bmkg-jatim-super-secret-key-123!");

export async function PATCH(req: Request) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.split(" ")[1];

    let payload;
    try {
      const verified = await jwtVerify(token, JWT_SECRET);
      payload = verified.payload;
    } catch (e) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
    }

    const { action, current_password, new_password, new_username } = await req.json();

    if (!current_password) {
      return NextResponse.json({ error: "Password saat ini diperlukan" }, { status: 400 });
    }

    // Fetch user from DB
    const users = await supabaseFetch("admin_users", `username=eq.${payload.username}`);
    if (!users || users.length === 0) {
      return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });
    }
    const user = users[0];

    // Verify current password
    const isValid = await bcrypt.compare(current_password, user.password_hash);
    if (!isValid) {
      return NextResponse.json({ error: "Password saat ini salah" }, { status: 401 });
    }

    if (action === "change_password") {
      if (!new_password || new_password.length < 6) {
        return NextResponse.json({ error: "Password baru minimal 6 karakter" }, { status: 400 });
      }

      const password_hash = await bcrypt.hash(new_password, 10);
      const updateRes = await supabaseUpdate("admin_users", `id=eq.${user.id}`, { password_hash });
      
      if (!updateRes) {
        return NextResponse.json({ error: "Gagal memperbarui password" }, { status: 500 });
      }

      return NextResponse.json({ message: "Password berhasil diperbarui" });
      
    } else if (action === "change_username") {
      if (!new_username) {
        return NextResponse.json({ error: "Username baru diperlukan" }, { status: 400 });
      }

      // Check if username already exists
      const existing = await supabaseFetch("admin_users", `username=eq.${new_username}`);
      if (existing && existing.length > 0 && existing[0].id !== user.id) {
        return NextResponse.json({ error: "Username sudah digunakan" }, { status: 400 });
      }

      const updateRes = await supabaseUpdate("admin_users", `id=eq.${user.id}`, { username: new_username });
      
      if (!updateRes) {
        return NextResponse.json({ error: "Gagal memperbarui username" }, { status: 500 });
      }

      // Generate new JWT since username is in payload
      const newToken = await new SignJWT({
        username: new_username,
        role: user.role,
        display_name: user.display_name
      })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('24h')
        .sign(JWT_SECRET);

      return NextResponse.json({ message: "Username berhasil diperbarui", token: newToken });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });

  } catch (error: any) {
    console.error("Update profile error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
