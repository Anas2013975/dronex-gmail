import { createHmac, randomBytes, randomInt } from "node:crypto";

export const CODE_LENGTH = 16;
export const CODE_TTL_MS = 5 * 60 * 1000;
export const SESSION_TTL_MS = 8 * 60 * 60 * 1000;
const ALPHANUM = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
const CODE_RE = /^[A-Za-z0-9]{16}$/;

export interface Identity { userId: string; guildId: string }
export interface SessionRecord extends Identity { expiresAt: Date }

/** Persistence boundary. Implemented by PgAuthStore (production) and MemoryAuthStore (tests). */
export interface AuthStore {
  replaceLoginCode(id: Identity, hash: string, expiresAt: Date): Promise<void>;
  /** Atomically marks the code as used. Returns null if unknown, used, or expired. */
  consumeLoginCode(hash: string, now: Date): Promise<Identity | null>;
  /** Returns true when the action is still within the allowed budget. */
  hitRateLimit(key: string, max: number, windowMs: number, now: Date): Promise<boolean>;
  createSession(hash: string, id: Identity, expiresAt: Date): Promise<void>;
  getSession(hash: string, now: Date): Promise<SessionRecord | null>;
  deleteSession(hash: string): Promise<void>;
}

export function generateCode(): string {
  let out = "";
  for (let i = 0; i < CODE_LENGTH; i++) out += ALPHANUM[randomInt(ALPHANUM.length)];
  return out;
}

/** HMAC-SHA256 so a leaked database cannot be used to recover live codes or tokens. */
export function hashSecret(value: string, secret: string): string {
  return createHmac("sha256", secret).update(value).digest("hex");
}

export async function issueLoginCode(store: AuthStore, id: Identity, secret: string, now = new Date()) {
  const allowed = await store.hitRateLimit(`key:${id.userId}`, 5, 10 * 60_000, now);
  if (!allowed) return { ok: false as const, reason: "rate_limited" as const };
  const code = generateCode();
  const expiresAt = new Date(now.getTime() + CODE_TTL_MS);
  await store.replaceLoginCode(id, hashSecret(code, secret), expiresAt);
  return { ok: true as const, code, expiresAt };
}

export type RedeemResult =
  | { ok: true; sessionToken: string; session: SessionRecord }
  | { ok: false; reason: "rate_limited" | "invalid" };

export async function redeemLoginCode(store: AuthStore, code: string, secret: string, clientKey: string, now = new Date()): Promise<RedeemResult> {
  // The attempt is counted BEFORE validation so malformed guesses also consume budget.
  if (!(await store.hitRateLimit(`login:${clientKey}`, 10, 15 * 60_000, now))) return { ok: false, reason: "rate_limited" };
  if (!CODE_RE.test(code)) return { ok: false, reason: "invalid" };
  const id = await store.consumeLoginCode(hashSecret(code, secret), now);
  if (!id) return { ok: false, reason: "invalid" };
  const sessionToken = randomBytes(32).toString("base64url");
  const expiresAt = new Date(now.getTime() + SESSION_TTL_MS);
  await store.createSession(hashSecret(sessionToken, secret), id, expiresAt);
  return { ok: true, sessionToken, session: { ...id, expiresAt } };
}

export function lookupSession(store: AuthStore, token: string, secret: string, now = new Date()) {
  return store.getSession(hashSecret(token, secret), now);
}
export function destroySession(store: AuthStore, token: string, secret: string) {
  return store.deleteSession(hashSecret(token, secret));
}
