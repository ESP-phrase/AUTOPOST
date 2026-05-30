import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { projects } from '@/lib/db/schema';
import { content } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { generateContent } from '@/lib/ai';
import type { ContentGenerationRequest } from '@/types';

export async function POST(request: Request) {
  try {
    const body: ContentGenerationRequest = await request.json();
    const db = getDb();

    const project = await db.select().from(projects).where(eq(projects.id, body.projectId)).limit(1);
    if (!project.length) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

    const result = await generateContent(
      project[0].name,
      project[0].tagline || `${project[0].name} - ${project[0].category}`,
      body.channel,
      body.format,
      body.tone,
    );

    const saved = await db.insert(content).values({
      projectId: body.projectId,
      channel: body.channel,
      format: body.format,
      body: result,
      tone: body.tone,
      status: 'draft',
    }).returning();

    return NextResponse.json(saved[0]);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
