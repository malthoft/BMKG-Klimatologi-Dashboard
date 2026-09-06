import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { supabaseRpc } from "@/lib/supabase";

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
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    if (payload.role !== "super_admin") {
      return NextResponse.json({ error: "Forbidden: Super Admin only" }, { status: 403 });
    }

    const { table_name } = await req.json();

    if (!table_name) {
      return NextResponse.json({ error: "table_name is required" }, { status: 400 });
    }

    // Panggil RPC function untuk membuat tabel
    const result = await supabaseRpc("create_aws_table", { p_table_name: table_name });

    if (!result) {
        throw new Error("RPC call failed or returned null");
    }

    return NextResponse.json({ success: true, result });

  } catch (error: any) {
    console.error("create-table error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
