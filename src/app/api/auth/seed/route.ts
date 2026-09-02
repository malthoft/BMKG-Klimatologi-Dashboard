import { NextResponse } from "next/server";
import { supabaseFetch, supabaseInsert } from "@/lib/supabase";
import bcrypt from "bcryptjs";

export async function GET(req: Request) {
  try {
    const users = await supabaseFetch("admin_users", `username=eq.Develop`);
    
    if (users && users.length > 0) {
      return NextResponse.json({ message: "Akun Developer sudah ada." });
    }

    const password_hash = await bcrypt.hash("dev123", 10);
    
    const res = await supabaseInsert("admin_users", {
      username: "Develop",
      password_hash,
      role: "developer",
      display_name: "Developer"
    });

    if (!res) {
      return NextResponse.json({ error: "Gagal membuat akun Developer." }, { status: 500 });
    }

    return NextResponse.json({ message: "Akun Developer berhasil dibuat!" });
  } catch (error: any) {
    console.error("Seed error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
