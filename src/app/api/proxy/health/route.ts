import { NextResponse } from 'next/server';
import { healthCheckAll } from '@/lib/proxy';

export async function POST() {
  try {
    const results = await healthCheckAll();
    return NextResponse.json(results);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
