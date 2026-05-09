import { TextChannel, Client } from 'discord.js';
import { BOT_CONFIG } from '../../core/config.js';
import { sendRawMessage } from '../../shared/utils/type17.js';

export async function logAction(client: Client, guildId: string, type: keyof typeof BOT_CONFIG.persona.logPrefix, title: string, description: string, color?: number) {
  try {
    const logChannelId = BOT_CONFIG.tempVoice.logChannelId;
    if (!logChannelId) return;

    const channel = await client.channels.fetch(logChannelId) as TextChannel;
    if (!channel) return;

    const prefix = BOT_CONFIG.persona.logPrefix[type] || '';
    const timestamp = new Intl.DateTimeFormat('id-ID', {
      timeZone: 'Asia/Jakarta',
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date());

    await sendRawMessage(
      channel as any, 
      `${description}\n**Waktu:** \`${timestamp}\``,
      `${prefix} ${title}`,
      color || BOT_CONFIG.colors.formal
    );
  } catch (error) {
    console.error('Error logging action:', error);
  }
}
