import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { supabaseFetch } from "@/lib/supabase";

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

    // 1. Fetch stations
    const stations = await supabaseFetch("stations");
    if (!stations) throw new Error("Gagal mengambil data stasiun dari database");

    const validStations = stations.filter((s: any) => s.mqtt_topic && s.table_name);
    
    // 2. Prepare topics
    const topics = validStations.map((s: any) => s.mqtt_topic.trim()).join(",");

    // 3. Prepare stationMap
    const stationMap: Record<string, string> = {};
    validStations.forEach((s: any) => {
      let rawName = (s.station_name || "").toLowerCase().trim();
      let key = rawName.replace(/^aws[\s_]+/, '').trim();
      stationMap[key] = s.table_name;
      let altKey = key.replace(/\s+/g, '_');
      stationMap[altKey] = s.table_name;
    });

    stationMap["smpk karangan"] = "aws_karangan";
    stationMap["smpk_karangan"] = "aws_karangan";
    stationMap["stage of pasuruan"] = "aws_stageof_pasuruan";
    stationMap["stageof pasuruan"] = "aws_stageof_pasuruan";

    // 4. Fetch n8n Workflow
    const n8nBaseUrl = process.env.N8N_BASE_URL;
    const n8nWorkflowId = process.env.N8N_WORKFLOW_ID;
    const n8nApiKey = process.env.N8N_API_KEY;

    if (!n8nBaseUrl || !n8nWorkflowId || !n8nApiKey) {
      throw new Error("Kredensial n8n belum diatur di server");
    }

    const wfRes = await fetch(`${n8nBaseUrl}/workflows/${n8nWorkflowId}`, {
      headers: {
        "X-N8N-API-KEY": n8nApiKey,
        "Accept": "application/json"
      }
    });

    if (!wfRes.ok) {
      const err = await wfRes.text();
      throw new Error(`Gagal mengambil workflow dari n8n: ${err}`);
    }

    const workflow = await wfRes.json();

    // 5. Modify Workflow
    let modified = false;
    workflow.nodes.forEach((node: any) => {
      if (node.name === "MQTT Trigger BMKG") {
        node.parameters.topics = topics;
        modified = true;
      }
      if (node.name === "Parse & Throttle 10m" && node.parameters.jsCode) {
        const newMapStr = `const stationMap = ${JSON.stringify(stationMap, null, 4)};`;
        node.parameters.jsCode = node.parameters.jsCode.replace(/const stationMap = \{[\s\S]*?\};/, newMapStr);
        modified = true;
      }
    });

    if (!modified) {
      throw new Error("Node yang akan dimodifikasi tidak ditemukan di n8n");
    }

    // 6. Save Workflow
    const putRes = await fetch(`${n8nBaseUrl}/workflows/${n8nWorkflowId}`, {
      method: "PUT",
      headers: {
        "X-N8N-API-KEY": n8nApiKey,
        "Accept": "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ nodes: workflow.nodes })
    });

    if (!putRes.ok) {
      const err = await putRes.text();
      throw new Error(`Gagal menyimpan perubahan ke n8n: ${err}`);
    }

    // Deactivate and Reactivate
    if (workflow.active) {
      await fetch(`${n8nBaseUrl}/workflows/${n8nWorkflowId}/deactivate`, {
        method: "POST",
        headers: { "X-N8N-API-KEY": n8nApiKey }
      });
      await fetch(`${n8nBaseUrl}/workflows/${n8nWorkflowId}/activate`, {
        method: "POST",
        headers: { "X-N8N-API-KEY": n8nApiKey }
      });
    }

    return NextResponse.json({ success: true, message: "Berhasil tersinkronisasi dengan n8n" });

  } catch (error: any) {
    console.error("n8n sync error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
