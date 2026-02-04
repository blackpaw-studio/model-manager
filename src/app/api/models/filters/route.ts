import { NextResponse } from "next/server";
import { getDatabase } from "../../../../db";
import { getFilterOptions } from "../../../../db/queries/models";

export const dynamic = "force-dynamic";

export async function GET() {
  const db = getDatabase();
  const options = getFilterOptions(db);
  return NextResponse.json(options);
}
