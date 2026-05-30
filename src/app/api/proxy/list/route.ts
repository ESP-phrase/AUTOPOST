import { NextResponse } from 'next/server';
import { getProxyList } from '@/lib/proxy';

export async function GET() {
  try {
    const list = await getProxyList();
    return NextResponse.json(list);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
