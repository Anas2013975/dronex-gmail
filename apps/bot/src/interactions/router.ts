import type { GuildMember, Interaction } from "discord.js";
import { CATEGORIES, type CommandCategory } from "@dronex/shared";
import { handlers, type Deps } from "../commands";
import { buildHelpMessage, HELP_HOME_ID, HELP_SELECT_ID } from "../help/buildHelp";
import { permissionChecker } from "../permissions";

const isCategory = (v: string): v is CommandCategory => Object.prototype.hasOwnProperty.call(CATEGORIES, v);

export async function routeInteraction(i: Interaction, d: Deps): Promise<void> {
  try {
    if (i.isChatInputCommand()) {
      const h = handlers[i.commandName];
      if (!h) { await i.reply({ content: "هذا الأمر غير متاح.", ephemeral: true }); return; }
      await h(i, d);
      return;
    }
    const isHelpSelect = i.isStringSelectMenu() && i.customId === HELP_SELECT_ID;
    const isHelpHome = i.isButton() && i.customId === HELP_HOME_ID;
    if (isHelpSelect || isHelpHome) {
      // Permissions are recomputed on every click; the custom id grants nothing.
      const ctx = { guildName: i.guild?.name ?? "السيرفر", pingMs: d.ping(), canUse: permissionChecker(i.inGuild() ? (i.member as GuildMember | null) : null, d.ownerIds) };
      const picked = isHelpSelect ? i.values[0] ?? "" : "";
      await i.update(buildHelpMessage(ctx, isHelpSelect && isCategory(picked) ? picked : undefined));
    }
  } catch (err) {
    d.log.error("interaction.failed", { error: err instanceof Error ? err.message : "unknown" });
    if (i.isRepliable() && !i.replied && !i.deferred) await i.reply({ content: "حدث خطأ غير متوقع.", ephemeral: true }).catch(() => undefined);
  }
}
