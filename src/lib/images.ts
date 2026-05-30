import OpenAI from 'openai';

const OPENAI_BASE = 'https://api.openai.com/v1';

export function createOpenAIClient(proxyUrl?: string): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY not set');

  return new OpenAI({
    apiKey,
    baseURL: proxyUrl ? `${proxyUrl}/v1` : OPENAI_BASE,
  });
}

export async function generateImage(prompt: string, proxyUrl?: string): Promise<string> {
  const client = createOpenAIClient(proxyUrl);

  const response = await client.images.generate({
    model: 'dall-e-3',
    prompt,
    n: 1,
    size: '1024x1024',
    quality: 'standard',
  });

  const data = response.data;
  if (!data || !data[0]?.url) throw new Error('No image URL returned');
  return data[0].url;
}

export async function generateGalleryImages(
  projectName: string,
  summary: string,
  count: number = 3,
  proxyUrl?: string
): Promise<string[]> {
  const prompts = [
    `A clean, modern SaaS dashboard screenshot for "${projectName}" showing analytics and charts. Professional UI design.`,
    `A hero image for "${projectName}" - ${summary}. Modern, startup style, gradient background, product illustration.`,
    `A feature showcase graphic for "${projectName}" with three key features displayed as clean UI cards. Dark theme, modern design.`,
    `An onboarding flow screenshot for "${projectName}" showing a simple, elegant signup page. Clean design.`,
    `A landing page mockup for "${projectName}" - hero section with headline, CTA button, and screenshot mockup. Modern SaaS style.`,
  ];

  const urls: string[] = [];
  const selectedPrompts = prompts.slice(0, count);

  for (const prompt of selectedPrompts) {
    try {
      const url = await generateImage(`${prompt} No text, just UI/design.`, proxyUrl);
      urls.push(url);
    } catch {
      urls.push('');
    }
  }

  return urls.filter(Boolean);
}
