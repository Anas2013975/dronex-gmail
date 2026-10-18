import { z } from "zod";

const schema = z.object({
  DISCORD_TOKEN: z.string().min(20),
  DISCORD_CLIENT_ID: z.string().regex(/^\d{15,25}$/),
  DISCORD_GUILD_ID: z.string().regex(/^\d{15,25}$/).optional(),
  DATABASE_URL: z.string().url(),
  DASHBOARD_URL: z.string().url(),
  AUTH_CODE_SECRET: z.string().min(32, "AUTH_CODE_SECRET must be at least 32 characters"),
  OWNER_DISCORD_IDS: z.string().default("").transform((v) => v.split(",").map((s) => s.trim()).filter(Boolean)),
  PORT: z.coerce.number().int().default(3001),
});
export type Env = z.infer<typeof schema>;

export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const parsed = schema.safeParse(source);
  if (!parsed.success) {
    // Report only field names/messages, never values.
    const msg = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    throw new Error(`Invalid environment: ${msg}`);
  }
  return parsed.data;
}
