import { neon } from '@neondatabase/serverless';

export async function setupDatabase() {
  const sql = neon(process.env.DATABASE_URL!);

  await sql`CREATE TABLE IF NOT EXISTS projects (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    url VARCHAR(512) NOT NULL,
    tagline VARCHAR(255) NOT NULL DEFAULT '',
    category VARCHAR(128) NOT NULL DEFAULT '',
    mrr REAL NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;

  await sql`CREATE TABLE IF NOT EXISTS assets (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    type VARCHAR(32) NOT NULL,
    blob_url TEXT NOT NULL,
    filename VARCHAR(512) NOT NULL,
    width INTEGER NOT NULL,
    height INTEGER NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;

  await sql`CREATE TABLE IF NOT EXISTS content (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    channel VARCHAR(32) NOT NULL,
    format VARCHAR(32) NOT NULL,
    body TEXT NOT NULL,
    tone VARCHAR(16) NOT NULL DEFAULT 'casual',
    status VARCHAR(16) NOT NULL DEFAULT 'draft',
    posted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;

  await sql`CREATE TABLE IF NOT EXISTS proxies (
    id SERIAL PRIMARY KEY,
    host VARCHAR(255) NOT NULL,
    port INTEGER NOT NULL,
    protocol VARCHAR(8) NOT NULL,
    username VARCHAR(255) NOT NULL DEFAULT '',
    enc_password TEXT NOT NULL DEFAULT '',
    status VARCHAR(16) NOT NULL DEFAULT 'unknown',
    last_checked TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;

  await sql`CREATE TABLE IF NOT EXISTS posts (
    id SERIAL PRIMARY KEY,
    content_id INTEGER REFERENCES content(id) ON DELETE SET NULL,
    channel VARCHAR(32) NOT NULL,
    posted_at TIMESTAMPTZ NOT NULL,
    platform_id VARCHAR(255),
    status VARCHAR(16) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;

  await sql`CREATE TABLE IF NOT EXISTS subreddits (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(128) NOT NULL,
    members INTEGER NOT NULL DEFAULT 0,
    promo_allowed BOOLEAN NOT NULL DEFAULT FALSE,
    notes TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;

  await sql`CREATE TABLE IF NOT EXISTS schedules (
    id SERIAL PRIMARY KEY,
    content_id INTEGER NOT NULL REFERENCES content(id) ON DELETE CASCADE,
    channel VARCHAR(32) NOT NULL,
    scheduled_at TIMESTAMPTZ NOT NULL,
    status VARCHAR(16) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;

  await sql`CREATE INDEX IF NOT EXISTS idx_content_project_id ON content(project_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_content_channel ON content(channel)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_assets_project_id ON assets(project_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_proxies_status ON proxies(status)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_schedules_status ON schedules(status)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_subreddits_project_id ON subreddits(project_id)`;

  return { success: true, message: 'Database tables created' };
}
