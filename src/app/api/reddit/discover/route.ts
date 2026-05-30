import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { projects } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { discoverSubreddits } from '@/lib/reddit';
import { generateContent } from '@/lib/ai';

export async function POST(request: Request) {
  try {
    const { projectId } = await request.json();
    if (!projectId) return NextResponse.json({ error: 'projectId required' }, { status: 400 });

    const db = getDb();
    const project = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);
    if (!project.length) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

    const keywords = await generateContent(
      project[0].name,
      project[0].tagline,
      'reddit',
      'case_study',
      'casual'
    ).then(() => {
      const desc = project[0].name + ' ' + project[0].category + ' ' + project[0].tagline;
      const words = desc.toLowerCase().match(/\b[a-z]{4,}\b/g) || [];
      return [...new Set(words)].slice(0, 10);
    });

    const results = await discoverSubreddits(keywords, project[0].name);
    return NextResponse.json(results);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
