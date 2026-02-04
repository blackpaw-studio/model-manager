import { NextResponse } from "next/server";
import { getConfig } from "../../../lib/config";
import { runScanner } from "../../../scanner";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const config = getConfig();
    const result = await runScanner(config);
    return NextResponse.json(result);
  } catch (err) {
    console.error("Scan failed:", err);
    return NextResponse.json(
      { error: "Scan failed", message: String(err) },
      { status: 500 }
    );
  }
}
