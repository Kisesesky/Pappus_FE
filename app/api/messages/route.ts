// app/api/messages/route.ts
import { NextRequest, NextResponse } from "next/server";

let memory: Record<string, any[]> = {
  general: [
    { id: "1", author:"Alice", text:"Welcome to #general!", ts: Date.now() },
    { id: "2", author:"Bob", text:"디자인 뼈대부터 가자!", ts: Date.now() }
  ],
  random: []
};

export async function GET(req: NextRequest) {
  const channelId = req.nextUrl.searchParams.get("channelId") || "general";
  return NextResponse.json(memory[channelId] ?? []);
}

export async function POST(req: NextRequest) {
  const { channelId, text, author = "You" } = await req.json();
  const msg = { id: String(Date.now()), author, text, ts: Date.now() };
  memory[channelId] = [...(memory[channelId] ?? []), msg];
  return NextResponse.json(msg, { status: 201 });
}
