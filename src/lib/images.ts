import OpenAI from 'openai';

const OPENROUTER_BASE = 'https://openrouter.ai/api/v1';
const OPENAI_BASE = 'https://api.openai.com/v1';

function getClient(proxyUrl?: string): { client: OpenAI; isOpenRouter: boolean } {
  const openRouterKey = process.env.OPENROUTER_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  if (openRouterKey) {
    return {
      client: new OpenAI({
        apiKey: openRouterKey,
        baseURL: proxyUrl ? `${proxyUrl}/v1` : OPENROUTER_BASE,
        defaultHeaders: {
          'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
          'X-Title': 'SaaS Launch Dashboard',
        },
      }),
      isOpenRouter: true,
    };
  }
  if (openaiKey) {
    return {
      client: new OpenAI({
        apiKey: openaiKey,
        baseURL: proxyUrl ? `${proxyUrl}/v1` : OPENAI_BASE,
      }),
      isOpenRouter: false,
    };
  }
  throw new Error('OPENROUTER_API_KEY or OPENAI_API_KEY required for images');
}

export async function generateImage(prompt: string, proxyUrl?: string): Promise<string> {
  const { client, isOpenRouter } = getClient(proxyUrl);

  if (isOpenRouter) {
    const response = await client.chat.completions.create({
      model: 'google/gemini-2.5-flash-image',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1024,
    });
    const text = response.choices[0]?.message?.content?.trim() || '';
    const match = text.match(/!\[.*?\]\((https?:\/\/[^\s)]+)\)/);
    if (match) return match[1];
    const urlMatch = text.match(/(https?:\/\/[^\s]+\.(?:png|jpg|jpeg|webp))/i);
    if (urlMatch) return urlMatch[0];
    throw new Error('OpenRouter: no image URL in response');
  }

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
