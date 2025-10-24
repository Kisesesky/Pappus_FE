// app/api/channels/route.ts
import { NextResponse } from "next/server";
export async function GET() {
  return NextResponse.json([
    { id: "general", name: "# general" },
    { id: "random", name: "# random" }
  ]);
}
