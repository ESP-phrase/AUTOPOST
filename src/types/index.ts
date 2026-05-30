export type Channel = 'producthunt' | 'indiehackers' | 'reddit' | 'x';
export type ContentTone = 'hype' | 'casual' | 'technical' | 'storyteller';
export type Status = 'draft' | 'ready' | 'submitted' | 'live' | 'failed';
export type PostStatus = 'pending' | 'posted' | 'failed';
export type ProxyProtocol = 'http' | 'https' | 'socks4' | 'socks5';
export type ProxyStatus = 'unknown' | 'alive' | 'dead';
export type AssetType = 'logo' | 'screenshot' | 'generated';

export type ContentFormat =
  | 'tagline' | 'description' | 'first_comment' | 'product_post'
  | 'how_i_built' | 'milestone' | 'discussion'
  | 'case_study' | 'launch_post' | 'ama' | 'reply_template'
  | 'thread_7' | 'mrr_milestone' | 'lesson' | 'poll' | 'zero_to_x';

export interface Project {
  id: number;
  name: string;
  url: string;
  tagline: string;
  category: string;
  mrr: number;
  createdAt: Date;
}

export interface Asset {
  id: number;
  projectId: number;
  type: AssetType;
  blobUrl: string;
  filename: string;
  width: number;
  height: number;
  order: number;
  createdAt: Date;
}

export interface Content {
  id: number;
  projectId: number;
  channel: Channel;
  format: ContentFormat;
  body: string;
  tone: ContentTone;
  status: Status;
  postedAt: Date | null;
  createdAt: Date;
}

export interface Proxy {
  id: number;
  host: string;
  port: number;
  protocol: ProxyProtocol;
  username: string;
  encPassword: string;
  status: ProxyStatus;
  lastChecked: Date | null;
  createdAt: Date;
}

export interface Post {
  id: number;
  contentId: number;
  channel: Channel;
  postedAt: Date;
  platformId: string;
  status: PostStatus;
  createdAt: Date;
}

export interface Subreddit {
  id: number;
  projectId: number;
  name: string;
  members: number;
  promoAllowed: boolean;
  notes: string;
  createdAt: Date;
}

export interface Schedule {
  id: number;
  contentId: number;
  channel: Channel;
  scheduledAt: Date;
  status: PostStatus;
  createdAt: Date;
}

export interface ContentGenerationRequest {
  projectId: number;
  channel: Channel;
  format: ContentFormat;
  tone: ContentTone;
}

export interface GenerateAllRequest {
  projectId: number;
  tone: ContentTone;
}

export interface ProxyImportRow {
  host: string;
  port: number;
  protocol: ProxyProtocol;
  username?: string;
  password?: string;
}

export interface ProxyImportRequest {
  proxies: ProxyImportRow[];
}

export interface RedditDiscoverRequest {
  projectId: number;
}

export interface RedditSubResult {
  name: string;
  members: number;
  promoAllowed: boolean;
  description: string;
  bestThreadType: string;
  suggestedTitle: string;
}

export interface XPostRequest {
  contentId: number;
}

export interface XScheduleRequest {
  contentId: number;
  scheduledAt: string;
}

export interface ContentPiece {
  channel: Channel;
  format: ContentFormat;
  body: string;
  status: 'draft';
}

export interface GenerateAllResponse {
  projectId: number;
  pieces: ContentPiece[];
}

export const CHANNEL_CONFIG: Record<Channel, {
  label: string;
  formats: { value: ContentFormat; label: string; maxChars?: number }[];
  description: string;
}> = {
  producthunt: {
    label: 'Product Hunt',
    description: 'Launch your product on Product Hunt',
    formats: [
      { value: 'tagline', label: 'Tagline', maxChars: 60 },
      { value: 'description', label: 'Description', maxChars: 260 },
      { value: 'first_comment', label: 'First Comment', maxChars: 2000 },
    ],
  },
  indiehackers: {
    label: 'Indie Hackers',
    description: 'Product listing and milestones',
    formats: [
      { value: 'product_post', label: 'Product Post', maxChars: 500 },
      { value: 'how_i_built', label: 'How I Built', maxChars: 3000 },
      { value: 'milestone', label: 'Milestone', maxChars: 500 },
      { value: 'discussion', label: 'Discussion', maxChars: 1000 },
    ],
  },
  reddit: {
    label: 'Reddit',
    description: 'Case studies and launches',
    formats: [
      { value: 'case_study', label: 'Case Study', maxChars: 2000 },
      { value: 'launch_post', label: 'Launch Post', maxChars: 500 },
      { value: 'ama', label: 'AMA', maxChars: 2000 },
      { value: 'reply_template', label: 'Reply Template', maxChars: 300 },
    ],
  },
  x: {
    label: 'X / Twitter',
    description: 'Build-in-public content',
    formats: [
      { value: 'thread_7', label: '7-Tweet Thread', maxChars: 280 * 7 },
      { value: 'mrr_milestone', label: 'MRR Milestone', maxChars: 280 },
      { value: 'lesson', label: 'Lesson Learned', maxChars: 280 },
      { value: 'poll', label: 'Poll', maxChars: 280 },
      { value: 'zero_to_x', label: '0 to $X Story', maxChars: 280 },
    ],
  },
};
