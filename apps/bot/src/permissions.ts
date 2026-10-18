import { PermissionFlagsBits, type GuildMember, type PermissionName } from "./discordTypes";

export function permissionChecker(member: GuildMember | null, ownerIds: string[]) {
  return (p: PermissionName): boolean => {
    if (!member) return false;
    if (ownerIds.includes(member.id)) return true;
    return member.permissions.has(PermissionFlagsBits.Administrator) || member.permissions.has(PermissionFlagsBits[p]);
  };
}
