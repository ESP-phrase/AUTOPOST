import { getDb } from './db';
import { proxies } from './db/schema';
import { eq } from 'drizzle-orm';
import { encrypt, decrypt } from './crypto';
import type { ProxyImportRow } from '@/types';

let poolIndex = 0;

async function fetchProxies() {
  const db = getDb();
  return db.select().from(proxies).where(eq(proxies.status, 'alive'));
}

export function getNextProxyUrl(aliveProxies: { host: string; port: number; protocol: string; username: string; encPassword: string }[]): { url: string; index: number } | null {
  if (aliveProxies.length === 0) return null;
  poolIndex = (poolIndex + 1) % aliveProxies.length;
  return { url: formatProxyUrl(aliveProxies[poolIndex]), index: poolIndex };
}

function formatProxyUrl(p: { protocol: string; host: string; port: number; username: string; encPassword: string }): string {
  return `${p.protocol}://${p.host}:${p.port}`;
}

export async function importProxies(rows: ProxyImportRow[]) {
  const db = getDb();
  const results = [];

  for (const row of rows) {
    const encPassword = row.password ? await encrypt(row.password) : '';
    const inserted = await db.insert(proxies).values({
      host: row.host,
      port: row.port,
      protocol: row.protocol,
      username: row.username || '',
      encPassword,
    }).returning();
    results.push(inserted[0]);
  }

  return { count: results.length, proxies: results };
}

export async function healthCheckAll() {
  const db = getDb();
  const all = await db.select().from(proxies);
  const results: { id: number; alive: boolean }[] = [];

  for (const p of all) {
    const alive = await checkProxyAlive(p.host, p.port, 5000);
    await db.update(proxies)
      .set({ status: alive ? 'alive' : 'dead', lastChecked: new Date() })
      .where(eq(proxies.id, p.id));
    results.push({ id: p.id, alive });
  }

  return results;
}

export async function checkProxyAlive(host: string, port: number, timeoutMs: number): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    const response = await fetch(`http://${host}:${port}`, { method: 'HEAD', signal: controller.signal });
    clearTimeout(timeout);
    return true;
  } catch {
    return false;
  }
}

export async function testProxyForAI(host: string, port: number): Promise<boolean> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return false;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const response = await fetch('https://openrouter.ai/api/v1/models', {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: controller.signal,
    });
    clearTimeout(timeout);
    return response.ok;
  } catch {
    return false;
  }
}

export async function getProxyList() {
  const db = getDb();
  return db.select().from(proxies).orderBy(proxies.createdAt);
}

export async function deleteProxy(id: number) {
  const db = getDb();
  await db.delete(proxies).where(eq(proxies.id, id));
  return { success: true };
}

export async function getAliveProxyCount() {
  const db = getDb();
  const result = await db.select().from(proxies).where(eq(proxies.status, 'alive'));
  return result.length;
}
