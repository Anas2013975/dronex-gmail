import type { AuthStore, Identity, SessionRecord } from "./auth";

/** In-memory AuthStore for tests only. Not for production use. */
export class MemoryAuthStore implements AuthStore {
  codes = new Map<string, Identity & { expiresAt: Date; used: boolean }>();
  sessions = new Map<string, SessionRecord>();
  limits = new Map<string, { count: number; start: number }>();
  async replaceLoginCode(id: Identity, hash: string, expiresAt: Date) {
    for (const [h, c] of this.codes) if (!c.used && c.userId === id.userId && c.guildId === id.guildId) this.codes.delete(h);
    this.codes.set(hash, { ...id, expiresAt, used: false });
  }
  async consumeLoginCode(hash: string, now: Date) {
    const c = this.codes.get(hash);
    if (!c || c.used || c.expiresAt <= now) return null;
    c.used = true;
    return { userId: c.userId, guildId: c.guildId };
  }
  async hitRateLimit(key: string, max: number, windowMs: number, now: Date) {
    const e = this.limits.get(key);
    if (!e || e.start < now.getTime() - windowMs) { this.limits.set(key, { count: 1, start: now.getTime() }); return true; }
    e.count++;
    return e.count <= max;
  }
  async createSession(hash: string, id: Identity, expiresAt: Date) { this.sessions.set(hash, { ...id, expiresAt }); }
  async getSession(hash: string, now: Date) {
    const s = this.sessions.get(hash);
    return s && s.expiresAt > now ? s : null;
  }
  async deleteSession(hash: string) { this.sessions.delete(hash); }
}
