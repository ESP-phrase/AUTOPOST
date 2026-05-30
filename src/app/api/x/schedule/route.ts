import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { schedules } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import type { XScheduleRequest } from '@/types';

export async function POST(request: Request) {
  try {
    const body: XScheduleRequest = await request.json();
    const db = getDb();

    const created = await db.insert(schedules).values({
      contentId: body.contentId,
      channel: 'x',
      scheduledAt: new Date(body.scheduledAt),
      status: 'pending',
    }).returning();

    return NextResponse.json(created[0]);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const db = getDb();
  const { searchParams } = new URL(request.url);
  const contentId = searchParams.get('contentId');

  if (contentId) {
    const list = await db.select().from(schedules)
      .where(eq(schedules.contentId, parseInt(contentId)))
      .orderBy(schedules.scheduledAt);
    return NextResponse.json(list);
  }

  const list = await db.select().from(schedules).orderBy(schedules.scheduledAt);
  return NextResponse.json(list);
}

export async function DELETE(request: Request) {
  const { id } = await request.json();
  const db = getDb();
  await db.delete(schedules).where(eq(schedules.id, id));
  return NextResponse.json({ success: true });
}
