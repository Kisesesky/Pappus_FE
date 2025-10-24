// app/api/calendar/events/route.ts
import { NextResponse } from 'next/server';

// TODO: 실제 소스 붙일 때 provider 토글, OAuth, syncToken 등 연결
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const start = searchParams.get('start'); // ISO
  const end = searchParams.get('end');     // ISO
  // const visible = searchParams.getAll('visible'); // 'google:primary' 등

  // 데모 응답(현재는 프론트 쪽 DEMO_EVENTS 사용 중이라 당장 불필요)
  return NextResponse.json({ events: [] });
}
