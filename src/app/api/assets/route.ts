import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { assets } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: Request) {
  const db = getDb();
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('projectId');
  if (!projectId) return NextResponse.json({ error: 'projectId required' }, { status: 400 });

  const list = await db.select().from(assets)
    .where(eq(assets.projectId, parseInt(projectId)))
    .orderBy(assets.order);

  return NextResponse.json(list);
}

export async function POST(request: Request) {
  const db = getDb();
  const body = await request.json();
  const created = await db.insert(assets).values({
    projectId: body.projectId,
    type: body.type,
    blobUrl: body.blobUrl,
    filename: body.filename,
    width: body.width,
    height: body.height,
    order: body.order || 0,
  }).returning();
  return NextResponse.json(created[0]);
}

export async function PUT(request: Request) {
  const db = getDb();
  const body = await request.json();
  const updated = await db.update(assets)
    .set({ order: body.order })
    .where(eq(assets.id, body.id))
    .returning();
  return NextResponse.json(updated[0]);
}

export async function DELETE(request: Request) {
  const db = getDb();
  const { id } = await request.json();
  await db.delete(assets).where(eq(assets.id, id));
  return NextResponse.json({ success: true });
}
