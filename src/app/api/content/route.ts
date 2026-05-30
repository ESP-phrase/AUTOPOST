import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { content } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: Request) {
  const db = getDb();
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('projectId');
  const channel = searchParams.get('channel');

  let list;
  if (projectId) {
    list = await db.select().from(content)
      .where(eq(content.projectId, parseInt(projectId)))
      .orderBy(content.createdAt);
  } else {
    list = await db.select().from(content).orderBy(content.createdAt);
  }

  if (channel) {
    list = list.filter(c => c.channel === channel);
  }
  return NextResponse.json(list);
}

export async function PUT(request: Request) {
  const db = getDb();
  const body = await request.json();
  const updated = await db.update(content)
    .set({ body: body.body, status: body.status, tone: body.tone })
    .where(eq(content.id, body.id))
    .returning();
  return NextResponse.json(updated[0]);
}

export async function DELETE(request: Request) {
  const db = getDb();
  const { id } = await request.json();
  await db.delete(content).where(eq(content.id, id));
  return NextResponse.json({ success: true });
}
