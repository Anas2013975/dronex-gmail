import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ContainerBuilder, MessageFlags, SeparatorBuilder, SeparatorSpacingSize, StringSelectMenuBuilder, TextDisplayBuilder } from "discord.js";
import { CATEGORIES, COMMANDS, visibleCategories, visibleCommands, type CategoryKey, type CommandMeta, type PermissionName } from "./registry";

export const HELP_SELECT_ID = "help:category";
export const HELP_HOME_ID = "help:home";
const ACCENT = 0x00b4ff;

export interface HelpContext {
  guildName: string;
  pingMs: number;
  canUse: (p: PermissionName) => boolean;
  commands?: readonly CommandMeta[];
}

const PERM_LABEL: Record<PermissionName, string> = { Administrator: "مدير (Administrator)", ManageGuild: "إدارة السيرفر (Manage Server)" };

function selectRow(ctx: HelpContext, selected?: CategoryKey) {
  const cmds = ctx.commands ?? COMMANDS;
  const menu = new StringSelectMenuBuilder().setCustomId(HELP_SELECT_ID).setPlaceholder("اختر قسماً");
  for (const key of visibleCategories(cmds, ctx.canUse)) {
    const c = CATEGORIES[key];
    menu.addOptions({ label: c.label, description: c.description, value: key, emoji: c.emoji, default: key === selected });
  }
  return new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(menu);
}

export function buildHelpMessage(ctx: HelpContext, category?: CategoryKey) {
  const cmds = ctx.commands ?? COMMANDS;
  const box = new ContainerBuilder().setAccentColor(ACCENT);
  const sep = () => new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small);

  if (!category) {
    box.addTextDisplayComponents(
      new TextDisplayBuilder().setContent("# Dronex Gmail — المساعدة"),
      new TextDisplayBuilder().setContent(`مرحباً بك في **${ctx.guildName}**. اختر قسماً من القائمة لعرض الأوامر المتاحة لك.\n🟢 حالة البوت: متصل • زمن الاستجابة: ${ctx.pingMs}ms`),
    );
    box.addSeparatorComponents(sep());
    box.addActionRowComponents(selectRow(ctx));
  } else {
    const info = CATEGORIES[category];
    const list = visibleCommands(cmds, ctx.canUse, category);
    const body = list.length === 0
      ? "لا توجد أوامر متاحة لك في هذا القسم."
      : list.map((c) => [
          `**${c.usage}** — ${c.description}`,
          `مثال: \`${c.example}\``,
          c.permission ? `الصلاحية المطلوبة: ${PERM_LABEL[c.permission]}` : null,
          c.warning ? `⚠️ ${c.warning}` : null,
        ].filter(Boolean).join("\n")).join("\n\n");
    box.addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${info.emoji} ${info.label}`), new TextDisplayBuilder().setContent(body.slice(0, 3900)));
    box.addSeparatorComponents(sep());
    box.addActionRowComponents(selectRow(ctx, category));
    box.addActionRowComponents(new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId(HELP_HOME_ID).setLabel("القائمة الرئيسية").setEmoji("🏠").setStyle(ButtonStyle.Secondary)));
  }
  return { components: [box], flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral } as const;
}
