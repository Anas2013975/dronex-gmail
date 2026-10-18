import { createServer } from "node:http";
import { Client, Events, GatewayIntentBits } from "discord.js";
import { PgAuthStore, createSql } from "@dronex/shared";
import { loadEnv } from "./env";
import { logger as log } from "./logger";
import { routeInteraction } from "./interactions/router";

const env = loadEnv();
const sql = createSql(env.DATABASE_URL);
const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const deps = { store: new PgAuthStore(sql), secret: env.AUTH_CODE_SECRET, dashboardUrl: env.DASHBOARD_URL, ownerIds: env.OWNER_DISCORD_IDS, ping: () => Math.max(0, Math.round(client.ws.ping)), log };

client.once(Events.ClientReady, (c) => log.info("bot.ready", { tag: c.user.tag, guilds: c.guilds.cache.size }));
client.on(Events.InteractionCreate, (i) => void routeInteraction(i, deps));
client.on(Events.Error, (e) => log.error("client.error", { error: e.message }));
client.on(Events.ShardDisconnect, (_e, id) => log.warn("shard.disconnect", { shard: id })); // discord.js reconnects automatically

// Health: /health = process alive, /ready = Discord connected AND database reachable.
const server = createServer(async (req, res) => {
  if (req.url === "/health") { res.writeHead(200).end("ok"); return; }
  if (req.url === "/ready") {
    try { await sql`SELECT 1`; const ok = client.isReady(); res.writeHead(ok ? 200 : 503).end(ok ? "ready" : "discord not ready"); }
    catch { res.writeHead(503).end("database unavailable"); }
    return;
  }
  res.writeHead(404).end();
});
server.listen(env.PORT, () => log.info("health.listening", { port: env.PORT }));

let stopping = false;
async function shutdown(sig: string) {
  if (stopping) return; stopping = true;
  log.info("shutdown", { sig });
  server.close(); await client.destroy(); await sql.end({ timeout: 5 }); process.exit(0);
}
process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));

await sql`SELECT 1`; // fail fast if the database is unreachable
await client.login(env.DISCORD_TOKEN);
