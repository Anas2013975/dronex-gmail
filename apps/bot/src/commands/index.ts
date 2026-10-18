import type { ChatInputCommandInteraction, GuildMember } from "discord.js";
import { issueLoginCode, type AuthStore } from "@dronex/shared";
import { buildHelpMessage } from "../help/buildHelp";
import { permissionChecker } from "../permissions";
import type { Logger } from "../logger";

export interface Deps { store: AuthStore; secret: string; dashboardUrl: string; ownerIds: string[]; ping: () => number; log: Logger }
export type Handler = (i: ChatInputCommandInteraction, d: Deps) => Promise<void>;

const memberOf = (i: ChatInputCommandInteraction) => (i.inGuild() ? (i.member as GuildMember | null) : null);

const help: Handler = async (i, d) => {
  if (!i.inGuild()) { await i.reply({ content: "هذا الأمر يعمل داخل السيرفرات فقط.", ephemeral: true }); return; }
  await i.reply(buildHelpMessage({ guildName: i.guild?.name ?? "السيرفر", pingMs: d.ping(), canUse: permissionChecker(memberOf(i), d.ownerIds) }));
};

const link: Handler = async (i, d) => {
  if (!i.inGuild() || !permissionChecker(memberOf(i), d.ownerIds)("ManageGuild")) {
    await i.reply({ content: "ليس لديك صلاحية استخدام هذا الأمر.", ephemeral: true }); return;
  }
  await i.reply({ content: `🔗 رابط لوحة التحكم:\n${new URL("/login", d.dashboardUrl).toString()}\n\nاستخدم /key للحصول على كود الدخول.`, ephemeral: true });
};

const key: Handler = async (i, d) => {
  if (!i.inGuild() || !i.guildId || !permissionChecker(memberOf(i), d.ownerIds)("ManageGuild")) {
    d.log.warn("key.denied", { userId: i.user.id, guildId: i.guildId });
    await i.reply({ content: "ليس لديك صلاحية استخدام هذا الأمر.", ephemeral: true }); return;
  }
  await i.deferReply({ ephemeral: true });
  try {
    const r = await issueLoginCode(d.store, { userId: i.user.id, guildId: i.guildId }, d.secret);
    if (!r.ok) { await i.editReply("⏳ طلبت أكواداً كثيرة. انتظر بضع دقائق ثم حاول مجدداً."); return; }
    d.log.info("key.issued", { userId: i.user.id, guildId: i.guildId }); // never log the code
    const ts = Math.floor(r.expiresAt.getTime() / 1000);
    await i.editReply(`🔐 كود الدخول الخاص بك (صالح حتى <t:${ts}:R>، يُستخدم مرة واحدة):\n\`\`\`${r.code}\`\`\`\nافتح الرابط من /link وأدخل الكود. لا تشاركه مع أحد.`);
  } catch (err) {
    d.log.error("key.failed", { userId: i.user.id, error: err instanceof Error ? err.message : "unknown" });
    await i.editReply("حدث خطأ أثناء توليد الكود. حاول لاحقاً.");
  }
};

export const handlers: Record<string, Handler> = { help, link, key };
