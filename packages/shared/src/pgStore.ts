import postgres from "postgres";
import type { AuthStore, Identity, SessionRecord } from "./auth";

export type Sql = postgres.Sql;
export function createSql(url: string): Sql {
  return postgres(url, { max: 5, idle_timeout: 20, connect_timeout: 10 });
}

export class PgAuthStore implements AuthStore {
  constructor(private sql: Sql) {}

  async replaceLoginCode(id: Identity, hash: string, expiresAt: Date) {
    await this.sql.begin(async (tx) => {
      await tx`INSERT INTO guilds (guild_id) VALUES (${id.guildId}) ON CONFLICT DO NOTHING`;
      await tx`DELETE FROM login_codes WHERE user_id = ${id.userId} AND guild_id = ${id.guildId} AND used_at IS NULL`;
      await tx`INSERT INTO login_codes (code_hash, user_id, guild_id, expires_at) VALUES (${hash}, ${id.userId}, ${id.guildId}, ${expiresAt})`;
    });
  }

  async consumeLoginCode(hash: string, now: Date) {
    // Single UPDATE ... RETURNING: two concurrent redeems cannot both succeed.
    const rows = await this.sql<{ user_id: string; guild_id: string }[]>`
      UPDATE login_codes SET used_at = ${now}
      WHERE code_hash = ${hash} AND used_at IS NULL AND expires_at > ${now}
      RETURNING user_id, guild_id`;
    const r = rows[0];
    return r ? { userId: r.user_id, guildId: r.guild_id } : null;
  }

  async hitRateLimit(key: string, max: number, windowMs: number, now: Date) {
    const cutoff = new Date(now.getTime() - windowMs);
    const rows = await this.sql<{ count: number }[]>`
      INSERT INTO rate_limits (key, count, window_start) VALUES (${key}, 1, ${now})
      ON CONFLICT (key) DO UPDATE SET
        count = CASE WHEN rate_limits.window_start < ${cutoff} THEN 1 ELSE rate_limits.count + 1 END,
        window_start = CASE WHEN rate_limits.window_start < ${cutoff} THEN ${now} ELSE rate_limits.window_start END
      RETURNING count`;
    return (rows[0]?.count ?? 1) <= max;
  }

  async createSession(hash: string, id: Identity, expiresAt: Date) {
    await this.sql`INSERT INTO sessions (token_hash, user_id, guild_id, expires_at) VALUES (${hash}, ${id.userId}, ${id.guildId}, ${expiresAt})`;
  }

  async getSession(hash: string, now: Date): Promise<SessionRecord | null> {
    const rows = await this.sql<{ user_id: string; guild_id: string; expires_at: Date }[]>`
      SELECT user_id, guild_id, expires_at FROM sessions WHERE token_hash = ${hash} AND expires_at > ${now}`;
    const r = rows[0];
    return r ? { userId: r.user_id, guildId: r.guild_id, expiresAt: r.expires_at } : null;
  }

  async deleteSession(hash: string) {
    await this.sql`DELETE FROM sessions WHERE token_hash = ${hash}`;
  }
}
