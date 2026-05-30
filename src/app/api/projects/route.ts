import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { projects } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
  const db = getDb();
  const list = await db.select().from(projects).orderBy(projects.createdAt);
  return NextResponse.json(list);
}

export async function POST(request: Request) {
  const db = getDb();
  const body = await request.json();
  const created = await db.insert(projects).values({
    name: body.name,
    url: body.url,
    tagline: body.tagline || '',
    category: body.category || '',
    mrr: body.mrr || 0,
  }).returning();
  return NextResponse.json(created[0]);
}

export async function PUT(request: Request) {
  const db = getDb();
  const body = await request.json();
  const updated = await db.update(projects)
    .set({
      name: body.name,
      url: body.url,
      tagline: body.tagline,
      category: body.category,
      mrr: body.mrr,
    })
    .where(eq(projects.id, body.id))
    .returning();
  return NextResponse.json(updated[0]);
}

export async function DELETE(request: Request) {
  const db = getDb();
  const { id } = await request.json();
  await db.delete(projects).where(eq(projects.id, id));
  return NextResponse.json({ success: true });
}
