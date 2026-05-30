import { NextResponse } from 'next/server';
import { generateGalleryImages } from '@/lib/images';

export async function POST(request: Request) {
  try {
    const { projectName, summary, count } = await request.json();
    if (!projectName) return NextResponse.json({ error: 'projectName required' }, { status: 400 });

    const urls = await generateGalleryImages(projectName, summary || projectName, count || 3);
    return NextResponse.json({ urls });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
