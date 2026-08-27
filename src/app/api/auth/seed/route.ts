import { NextResponse } from "next/server";
import { supabaseInsert, supabaseFetch } from "@/lib/supabase";
import bcrypt from "bcryptjs";

export async function GET(req: Request) {
  try {
    // Check if users already exist
    const users = await supabaseFetch("admin_users", "limit=1");
    if (users && users.length > 0) {
      return NextResponse.json({ message: "Admin users already seeded." });
    }

    // Seed Super Admin
    const superAdminPassword = await bcrypt.hash("Teknisi123", 10);
    await supabaseInsert("admin_users", {
      username: "Teknisi",
      password_hash: superAdminPassword,
      role: "super_admin",
      display_name: "Super Admin Teknisi",
    });

    // Seed Admin
    const adminPassword = await bcrypt.hash("Admin123", 10);
    await supabaseInsert("admin_users", {
      username: "Admin",
      password_hash: adminPassword,
      role: "admin",
      display_name: "Admin Default",
    });

    return NextResponse.json({ message: "Admin users seeded successfully!" });

  } catch (error: any) {
    console.error("Seed error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
