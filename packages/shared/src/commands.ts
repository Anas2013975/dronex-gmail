/** Single source of truth for command metadata. /help and slash registration are generated from this list. */
export type CommandCategory = "general" | "auth" | "info" | "tickets" | "inventory" | "giveaways" | "broadcast" | "moderation" | "voice" | "ratings" | "roles" | "owner";
export type PermissionName = "Administrator" | "ManageGuild";

export const CATEGORIES: Record<CommandCategory, { label: string; emoji: string; description: string }> = {
  general: { label: "الأوامر العامة", emoji: "📌", description: "أوامر أساسية للجميع" },
  auth: { label: "تسجيل الدخول للوحة التحكم", emoji: "🔐", description: "الدخول الآمن للوحة" },
  info: { label: "المعلومات والقوانين", emoji: "📖", description: "قوانين السيرفر والمعلومات" },
  tickets: { label: "التذاكر والمهام", emoji: "🎫", description: "إنشاء ومراجعة المهام" },
  inventory: { label: "المخزون والمنتجات", emoji: "📦", description: "إدارة المخزون المسموح" },
  giveaways: { label: "المسابقات", emoji: "🎉", description: "السحوبات والجوائز" },
  broadcast: { label: "البث والرسائل", emoji: "📣", description: "الرسائل الجماعية" },
  moderation: { label: "الإشراف", emoji: "🛡️", description: "أدوات الإدارة" },
  voice: { label: "إدارة الصوت", emoji: "🔊", description: "الاتصال الصوتي" },
  ratings: { label: "التقييمات والردود التلقائية", emoji: "⭐", description: "التقييمات والردود" },
  roles: { label: "الرتب والصلاحيات", emoji: "🏅", description: "الرتب والمراحل" },
  owner: { label: "أوامر المالك والإدارة", emoji: "👑", description: "إعدادات المالك" },
};

export interface CommandMeta {
  name: string;
  description: string;
  usage: string;
  example: string;
  category: CommandCategory;
  type: "slash" | "prefix";
  permission: PermissionName | null;
  enabled: boolean;
  warning?: string;
}

/** Only commands that are actually implemented in apps/bot belong here. */
export const COMMANDS: readonly CommandMeta[] = [
  { name: "help", description: "عرض قائمة المساعدة التفاعلية", usage: "/help", example: "/help", category: "general", type: "slash", permission: null, enabled: true },
  { name: "link", description: "الحصول على رابط لوحة التحكم", usage: "/link", example: "/link", category: "auth", type: "slash", permission: "ManageGuild", enabled: true },
  { name: "key", description: "توليد كود دخول مؤقت للوحة التحكم", usage: "/key", example: "/key", category: "auth", type: "slash", permission: "ManageGuild", enabled: true,
    warning: "الكود من 16 خانة، صالح 5 دقائق، ويُستخدم مرة واحدة فقط. لا تشاركه مع أحد." },
];

export function visibleCommands(commands: readonly CommandMeta[], canUse: (p: PermissionName) => boolean, category?: CommandCategory) {
  return commands.filter((c) => c.enabled && (!c.permission || canUse(c.permission)) && (!category || c.category === category));
}

export function visibleCategories(commands: readonly CommandMeta[], canUse: (p: PermissionName) => boolean): CommandCategory[] {
  const present = new Set(visibleCommands(commands, canUse).map((c) => c.category));
  return (Object.keys(CATEGORIES) as CommandCategory[]).filter((k) => present.has(k));
}
