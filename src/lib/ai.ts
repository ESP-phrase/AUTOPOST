import OpenAI from 'openai';
import type { Channel, ContentTone, ContentFormat } from '@/types';
import { CHANNEL_CONFIG } from '@/types';

const OPENROUTER_BASE = 'https://openrouter.ai/api/v1';
const MODEL = 'deepseek/deepseek-chat';

export function createAIClient(proxyUrl?: string): OpenAI {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error('OPENROUTER_API_KEY not set');

  return new OpenAI({
    apiKey,
    baseURL: proxyUrl ? `${proxyUrl}/v1` : OPENROUTER_BASE,
    defaultHeaders: {
      'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      'X-Title': 'SaaS Launch Dashboard',
    },
  });
}

const PROMPTS: Record<Channel, Partial<Record<ContentFormat, string>>> = {
  producthunt: {
    tagline: "Write a Product Hunt tagline for a SaaS called NAME. The product does: SUMMARY. Max 60 characters. Tone: TONE. Output only the tagline.",
    description: "Write a Product Hunt description (260 chars max) for a SaaS called NAME. The product does: SUMMARY. Include what problem it solves and who it's for. Tone: TONE. Output only the description.",
    first_comment: "You are the maker of NAME, a SaaS that SUMMARY. Write a genuine, personal first comment for a Product Hunt launch. Share why you built it, the journey, and what you hope people get from it. Make it feel human. Tone: TONE. Max 2000 chars.",
  },
  indiehackers: {
    product_post: "Write an Indie Hackers product post for NAME, a SaaS that SUMMARY. Include why you built it, key features, and future plans. Tone: TONE.",
    how_i_built: `Write a "How I Built NAME" narrative for Indie Hackers. Cover the problem, the build process, tech stack, launch, and early traction. Make it a story. Tone: TONE.`,
    milestone: "Write a short milestone announcement for NAME on Indie Hackers. Mention traction or MRR. Celebrate honestly. Tone: TONE.",
    discussion: "Write an engaging discussion starter for Indie Hackers related to NAME. Ask a question that invites community participation. Tone: TONE.",
  },
  reddit: {
    case_study: "Write a Reddit case study for r/SaaS about NAME. Format: Problem → Solution → How I Built It → Results. Include real numbers if possible. Under 2000 characters. Tone: TONE.",
    launch_post: "Write a Show HN-style launch post for NAME. Share what it does, why you built it, and ask for feedback. Brief and genuine. Under 500 characters. Tone: TONE.",
    ama: "Write an AMA intro for r/SaaS for the maker of NAME. Include background, motivation, and invite questions. Under 2000 chars. Tone: TONE.",
    reply_template: "Write 5 short reply templates for the maker of NAME to use when replying to comments on Reddit. Each under 300 chars. Vary the tone.",
  },
  x: {
    thread_7: "Write a 7-tweet build-in-public thread about NAME. Structure: 1) Hook/problem 2) What I built 3) Tech stack 4) First users 5) Mistake/learning 6) Current traction 7) Ask/CTA. Each tweet under 280 chars. Number them 1/7, 2/7 etc. Tone: TONE.",
    mrr_milestone: "Write a tweet announcing an MRR milestone for NAME. Be humble, share a learning. Under 280 chars. Tone: TONE.",
    lesson: "Write a tweet sharing a key lesson learned while building NAME. Under 280 chars. Tone: TONE.",
    poll: "Write a tweet with a poll related to NAME's market. Include 4 poll options. Under 280 chars. Tone: TONE.",
    zero_to_x: "Write a tweet telling the story of going from 0 to $X with NAME. Key moments only. Under 280 chars. Tone: TONE.",
  },
};

export async function generateContent(
  projectName: string,
  summary: string,
  channel: Channel,
  format: ContentFormat,
  tone: ContentTone,
  proxyUrl?: string
): Promise<string> {
  const client = createAIClient(proxyUrl);
  const template = PROMPTS[channel]?.[format];
  if (!template) throw new Error(`No prompt template for ${channel}/${format}`);

  const prompt = template.replace(/NAME/g, projectName).replace(/SUMMARY/g, summary).replace(/TONE/g, tone);

  const response = await client.chat.completions.create({
    model: MODEL,
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 2048,
    temperature: 0.8,
  });

  let content = response.choices[0]?.message?.content?.trim() || '';

  const maxChars = CHANNEL_CONFIG[channel]?.formats.find(f => f.value === format)?.maxChars;
  if (maxChars && content.length > maxChars) {
    content = content.substring(0, maxChars);
  }

  return content;
}
