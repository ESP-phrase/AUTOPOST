import type { RedditSubResult } from '@/types';

const SAAS_SUBREDDITS = [
  'SaaS', 'sideproject', 'startups', 'webdev', 'Entrepreneur',
  'indiehackers', 'smallbusiness', 'marketing', 'growthhacking',
  'productivity', 'nocode', 'lowcode', 'programming', 'javascript',
  'web_design', 'userexperience', 'SaaS_Sales', 'MicroSaaS',
  'SaaSSales', 'EntrepreneurRideAlong', 'technews', 'technology',
];

interface RedditSubAbout {
  data: {
    display_name: string;
    subscribers: number;
    public_description: string;
    over18: boolean;
    subreddit_type: string;
  };
}

export async function searchReddit(query: string): Promise<RedditSubAbout[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(
      `https://www.reddit.com/subreddits/search.json?q=${encodeURIComponent(query)}&limit=10&include_over_18=false`,
      { signal: controller.signal }
    );
    if (!response.ok) return [];
    const json = await response.json();
    return json.data?.children?.map((c: { data: RedditSubAbout['data'] }) => ({ data: c.data })) || [];
  } catch {
    return [];
  } finally {
    clearTimeout(timeout);
  }
}

export async function getSubredditRules(subreddit: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(
      `https://www.reddit.com/r/${subreddit}/about/rules.json`,
      { signal: controller.signal }
    );
    if (!response.ok) return '';
    const json = await response.json();
    return json.rules?.map((r: { short_name: string; description: string }) => `${r.short_name}: ${r.description}`).join('\n') || '';
  } catch {
    return '';
  } finally {
    clearTimeout(timeout);
  }
}

export async function discoverSubreddits(
  keywords: string[],
  projectName: string,
  proxyUrl?: string
): Promise<RedditSubResult[]> {
  const found: Map<string, RedditSubAbout> = new Map();

  for (const keyword of keywords) {
    try {
      const results = await searchReddit(keyword);
      for (const r of results) {
        if (r.data.subscribers > 100 && !r.data.over18) {
          found.set(r.data.display_name, r);
        }
      }
    } catch {
      continue;
    }
  }

  const results: RedditSubResult[] = [];

  for (const [name, info] of found) {
    const rules = await getSubredditRules(name);
    const promoAllowed = !rules.toLowerCase().includes('self promo') && !rules.toLowerCase().includes('self-promotion');

    results.push({
      name,
      members: info.data.subscribers,
      promoAllowed,
      description: info.data.public_description || '',
      bestThreadType: promoAllowed ? 'Show HN / Launch Post' : 'Comment in discussion thread',
      suggestedTitle: `Show ${projectName}: ${promoAllowed ? 'launch' : 'discussion'} post`,
    });
  }

  return results.sort((a, b) => b.members - a.members);
}
