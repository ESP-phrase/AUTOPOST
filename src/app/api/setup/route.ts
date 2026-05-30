import { NextResponse } from 'next/server';
import { setupDatabase } from '@/lib/db/setup';

export async function POST() {
  try {
    const result = await setupDatabase();
    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
