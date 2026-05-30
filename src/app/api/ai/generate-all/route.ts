import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { projects } from '@/lib/db/schema';
import { content } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { generateContent } from '@/lib/ai';
import { Semaphore, runWithSemaphore } from '@/lib/semaphore';
import type { GenerateAllRequest, Channel, ContentFormat, ContentTone, ContentPiece } from '@/types';
import { CHANNEL_CONFIG } from '@/types';

export async function POST(request: Request) {
  try {
    const body: GenerateAllRequest = await request.json();
    const db = getDb();

    const project = await db.select().from(projects).where(eq(projects.id, body.projectId)).limit(1);
    if (!project.length) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

    const sem = new Semaphore(4);
    const pieces: ContentPiece[] = [];
    const errors: string[] = [];

    const tasks: Array<() => Promise<void>> = [];

    const channels: Channel[] = ['producthunt', 'indiehackers', 'reddit', 'x'];
    for (const channel of channels) {
      const formats = CHANNEL_CONFIG[channel].formats;
      for (const fmt of formats) {
        const tone = body.tone;
        tasks.push(async () => {
          await runWithSemaphore(sem, async () => {
            try {
              const generatedText = await generateContent(
                project[0].name,
                project[0].tagline || `${project[0].name} - ${project[0].category}`,
                channel,
                fmt.value as ContentFormat,
                tone,
              );
              pieces.push({ channel, format: fmt.value as ContentFormat, body: generatedText, status: 'draft' });
            } catch (e: any) {
              errors.push(`${channel}/${fmt.value}: ${e.message}`);
            }
          });
        });
      }
    }

    await Promise.all(tasks);

    if (pieces.length > 0) {
      await db.insert(content).values(
        pieces.map(p => ({
          projectId: body.projectId,
          channel: p.channel,
          format: p.format,
          body: p.body,
          tone: body.tone,
          status: 'draft' as const,
        }))
      );
    }

    return NextResponse.json({ projectId: body.projectId, pieces: pieces.length, errors });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
