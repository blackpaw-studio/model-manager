import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { validateSession } from "@/lib/session";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("mm_session")?.value;

  if (!token || !validateSession(token)) {
    return NextResponse.json({ authenticated: false });
  }

  return NextResponse.json({ authenticated: true });
}
