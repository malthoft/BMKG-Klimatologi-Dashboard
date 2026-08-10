import { NextResponse } from "next/server";

export async function GET() {
  try {
    const res = await fetch("https://time.bmkg.go.id/JamServer.php", {
      cache: "no-store",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      },
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch BMKG time server: ${res.statusText}`);
    }

    const text = await res.text();
    // Example format: var servertimeOBJ = new Date(2026,08-1,07,09,27,25);var TimeZone = 'WIB';
    const regex = /new\s+Date\s*\(\s*(\d+)\s*,\s*(\d+)-1\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/i;
    const match = text.match(regex);

    if (!match) {
      throw new Error("Invalid BMKG time format received");
    }

    const year = parseInt(match[1], 10);
    const month = parseInt(match[2], 10); // 1-indexed (e.g. 8 for August)
    const day = parseInt(match[3], 10);
    const hoursWIB = parseInt(match[4], 10);
    const minutes = parseInt(match[5], 10);
    const seconds = parseInt(match[6], 10);

    // Convert WIB (UTC+7) to UTC epoch timestamp
    const utcTimestamp = Date.UTC(year, month - 1, day, hoursWIB - 7, minutes, seconds);

    return NextResponse.json({
      success: true,
      timestamp: utcTimestamp,
      serverTimeWIB: `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")} ${String(hoursWIB).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")} WIB`,
      source: "https://time.bmkg.go.id",
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch time",
        timestamp: Date.now(),
        source: "fallback-client",
      },
      { status: 500 }
    );
  }
}
