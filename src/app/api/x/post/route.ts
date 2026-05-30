import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { content } from '@/lib/db/schema';
import { posts } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { postTweet, postThread } from '@/lib/x';
import type { XPostRequest } from '@/types';

export async function POST(request: Request) {
  try {
    const body: XPostRequest = await request.json();
    const db = getDb();

    const contentData = await db.select().from(content).where(eq(content.id, body.contentId)).limit(1);
    if (!contentData.length) return NextResponse.json({ error: 'Content not found' }, { status: 404 });

    const c = contentData[0];

    let result: { id: string }[];

    if (c.format === 'thread_7') {
      const tweets = c.body.split(/\d+\/\d+/).filter(t => t.trim().length > 0).map(t => t.trim()).filter(t => t.length > 0);
      if (tweets.length < 2) {
        result = [await postTweet(c.body.substring(0, 280))];
      } else {
        result = await postThread(tweets.map(t => t.substring(0, 280)));
      }
    } else {
      const tweet = await postTweet(c.body.substring(0, 280));
      result = [tweet];
    }

    for (const r of result) {
      await db.insert(posts).values({
        contentId: c.id,
        channel: 'x',
        postedAt: new Date(),
        platformId: r.id,
        status: 'posted',
      });
    }

    await db.update(content)
      .set({ status: 'submitted', postedAt: new Date() })
      .where(eq(content.id, c.id));

    return NextResponse.json({ success: true, posted: result });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
