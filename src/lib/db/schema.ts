import { pgTable, serial, integer, text, varchar, timestamp, boolean, real } from 'drizzle-orm/pg-core';

export const projects = pgTable('projects', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  url: varchar('url', { length: 512 }).notNull(),
  tagline: varchar('tagline', { length: 255 }).notNull().default(''),
  category: varchar('category', { length: 128 }).notNull().default(''),
  mrr: real('mrr').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const assets = pgTable('assets', {
  id: serial('id').primaryKey(),
  projectId: integer('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  type: varchar('type', { length: 32 }).notNull(),
  blobUrl: text('blob_url').notNull(),
  filename: varchar('filename', { length: 512 }).notNull(),
  width: integer('width').notNull(),
  height: integer('height').notNull(),
  order: integer('order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const content = pgTable('content', {
  id: serial('id').primaryKey(),
  projectId: integer('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  channel: varchar('channel', { length: 32 }).notNull(),
  format: varchar('format', { length: 32 }).notNull(),
  body: text('body').notNull(),
  tone: varchar('tone', { length: 16 }).notNull().default('casual'),
  status: varchar('status', { length: 16 }).notNull().default('draft'),
  postedAt: timestamp('posted_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const proxies = pgTable('proxies', {
  id: serial('id').primaryKey(),
  host: varchar('host', { length: 255 }).notNull(),
  port: integer('port').notNull(),
  protocol: varchar('protocol', { length: 8 }).notNull(),
  username: varchar('username', { length: 255 }).notNull().default(''),
  encPassword: text('enc_password').notNull().default(''),
  status: varchar('status', { length: 16 }).notNull().default('unknown'),
  lastChecked: timestamp('last_checked', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const posts = pgTable('posts', {
  id: serial('id').primaryKey(),
  contentId: integer('content_id').references(() => content.id, { onDelete: 'set null' }),
  channel: varchar('channel', { length: 32 }).notNull(),
  postedAt: timestamp('posted_at', { withTimezone: true }).notNull(),
  platformId: varchar('platform_id', { length: 255 }),
  status: varchar('status', { length: 16 }).notNull().default('pending'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const subreddits = pgTable('subreddits', {
  id: serial('id').primaryKey(),
  projectId: integer('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 128 }).notNull(),
  members: integer('members').notNull().default(0),
  promoAllowed: boolean('promo_allowed').notNull().default(false),
  notes: text('notes').notNull().default(''),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const schedules = pgTable('schedules', {
  id: serial('id').primaryKey(),
  contentId: integer('content_id').notNull().references(() => content.id, { onDelete: 'cascade' }),
  channel: varchar('channel', { length: 32 }).notNull(),
  scheduledAt: timestamp('scheduled_at', { withTimezone: true }).notNull(),
  status: varchar('status', { length: 16 }).notNull().default('pending'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
