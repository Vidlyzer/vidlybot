import { Message, Events, PermissionFlagsBits, TextChannel, Routes } from 'discord.js';
import { EconomyService } from '../../application/services/economy.service.js';
import { BOT_CONFIG } from '../../core/config.js';
import { SYSTEM_MESSAGES } from '../../core/messages.js';
import { sendRawMessage } from '../../shared/utils/type17.js';

export const name = Events.MessageCreate;
export const once = false;

export async function execute(message: Message) {
  if (message.author.bot || !message.guild) return;

  // 1. Sistem Auto-mod (Minimalist Style)
  const content = message.content.toLowerCase();
  const hasLink = BOT_CONFIG.autoMod.filterLinks && /(https?:\/\/[^\s]+)/g.test(content);
  const hasBadWord = BOT_CONFIG.autoMod.filterBadWords && BOT_CONFIG.autoMod.badWords.some(word => content.includes(word));

  if (hasLink || hasBadWord) {
    if (!message.member?.permissions.has(PermissionFlagsBits.ManageMessages)) {
      try {
        await message.delete();
        const channel = message.channel as TextChannel;
        const warningData: any = await sendRawMessage(
          channel as any, 
          SYSTEM_MESSAGES.autoMod.messageDeleted.replace('{symbol}', BOT_CONFIG.persona.symbols.warn),
          '', // Menghapus judul
          BOT_CONFIG.colors.warn
        );
        
        if (warningData && warningData.id) {
          setTimeout(() => {
            message.client.rest.delete(Routes.channelMessage(channel.id, warningData.id)).catch(() => {});
          }, 3000);
        }
        return; 
      } catch (e) {}
    }
  }

  // 2. XP Reward (Dengan Cooldown dari Config)
  await EconomyService.handleChatXP(message.author.id, message.guild.id);
}
