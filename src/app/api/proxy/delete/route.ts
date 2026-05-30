import { NextResponse } from 'next/server';
import { deleteProxy } from '@/lib/proxy';

export async function POST(request: Request) {
  try {
    const { id } = await request.json();
    const result = await deleteProxy(id);
    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
