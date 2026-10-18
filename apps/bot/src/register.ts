import { REST, Routes, SlashCommandBuilder } from "discord.js";
import { COMMANDS } from "@dronex/shared";

export function buildSlashDefinitions() {
  return COMMANDS.filter((c) => c.type === "slash" && c.enabled)
    .map((c) => new SlashCommandBuilder().setName(c.name).setDescription(c.description).setContexts(0).toJSON());
}

if (process.argv[1]?.endsWith("register.ts")) {
  const { DISCORD_TOKEN: token, DISCORD_CLIENT_ID: appId, DISCORD_GUILD_ID: guildId } = process.env;
  if (!token || !appId) { console.error("DISCORD_TOKEN and DISCORD_CLIENT_ID are required."); process.exit(1); }
  const rest = new REST({ version: "10" }).setToken(token);
  const route = guildId ? Routes.applicationGuildCommands(appId, guildId) : Routes.applicationCommands(appId);
  const defs = buildSlashDefinitions();
  await rest.put(route, { body: defs });
  console.log(`Registered ${defs.length} command(s) ${guildId ? `to guild ${guildId}` : "globally"}: ${defs.map((d) => d.name).join(", ")}`);
}
