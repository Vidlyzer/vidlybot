import { GuildMember } from 'discord.js';
import { BOT_CONFIG } from '../../core/config.js';

export async function isGodMode(member: GuildMember): Promise<boolean> {
  // 1. Cek Hardcoded Admin Role ID
  if (BOT_CONFIG.adminRoleId && member.roles.cache.has(BOT_CONFIG.adminRoleId)) {
    return true;
  }

  // 2. Fallback ke Administrator permission
  return member.permissions.has('Administrator');
}
