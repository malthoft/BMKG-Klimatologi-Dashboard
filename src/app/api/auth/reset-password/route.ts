import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { supabaseFetch, supabaseUpdate } from "@/lib/supabase";
import bcrypt from "bcryptjs";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "bmkg-jatim-super-secret-key-123!");

export async function POST(req: Request) {
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

    if (payload.role !== "super_admin" && payload.role !== "developer") {
      return NextResponse.json({ error: "Hanya Super Admin atau Developer yang dapat mereset password." }, { status: 403 });
    }

    const { target_user_id } = await req.json();

    if (!target_user_id) {
      return NextResponse.json({ error: "ID user diperlukan." }, { status: 400 });
    }

    const users = await supabaseFetch("admin_users", `id=eq.${target_user_id}`);
    if (!users || users.length === 0) {
      return NextResponse.json({ error: "User tidak ditemukan." }, { status: 404 });
    }

    const targetUser = users[0];

    if (targetUser.role === "developer") {
      return NextResponse.json({ error: "Tidak dapat mereset password akun Developer." }, { status: 403 });
    }

    if (payload.role === "super_admin" && targetUser.role === "super_admin") {
      return NextResponse.json({ error: "Super Admin tidak dapat mereset password sesama Super Admin." }, { status: 403 });
    }

    const password_hash = await bcrypt.hash("123456", 10);
    const updateRes = await supabaseUpdate("admin_users", `id=eq.${target_user_id}`, { password_hash });
    
    if (!updateRes) {
      return NextResponse.json({ error: "Gagal mereset password." }, { status: 500 });
    }

    return NextResponse.json({ message: `Password user ${targetUser.username} berhasil direset menjadi '123456'. Harap beritahu user untuk segera mengganti passwordnya.` });

  } catch (error: any) {
    console.error("Reset password error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
