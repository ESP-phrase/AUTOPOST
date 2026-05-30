import { NextResponse } from 'next/server';
import { importProxies } from '@/lib/proxy';

export async function POST(request: Request) {
  try {
    const { proxies } = await request.json();
    if (!proxies || !Array.isArray(proxies)) {
      return NextResponse.json({ error: 'proxies array required' }, { status: 400 });
    }
    const result = await importProxies(proxies);
    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
