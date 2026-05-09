import { VoiceState, Events, VoiceChannel } from 'discord.js';
import { db } from '../../infrastructure/database/db.js';
import { voiceRooms } from '../../infrastructure/database/schema.js';
import { eq } from 'drizzle-orm';
import { VoiceService } from '../../application/services/voice.service.js';
import { EconomyService } from '../../application/services/economy.service.js';
import { BOT_CONFIG } from '../../core/config.js';

export const name = Events.VoiceStateUpdate;
export const once = false;

export async function execute(oldState: VoiceState, newState: VoiceState) {
  const { member, guild } = newState;
  if (!member || !guild) return;

  // 1. Logika Join-to-Create (Hardcoded Config)
  if (newState.channelId === BOT_CONFIG.tempVoice.createVoiceChannelId) {
    console.log(`[TRIGGER] ${member.user.tag} joined Join-to-Create channel.`);
    
    if (VoiceService.isOnCooldown(member.id)) {
      console.log(`[!] ${member.user.tag} is on cooldown, skipping.`);
      return;
    }
    VoiceService.setCooldown(member.id);

    try {
      const triggerChannel = newState.channel as VoiceChannel;
      await VoiceService.createTempChannel(member, triggerChannel);
    } catch (error) {
      console.error('Error in Join-to-Create:', error);
    }
    return;
  }

  // 2. Logika Masuk Room (Batal Hapus & Log)
  if (newState.channelId) {
    const isTemp = await db.select().from(voiceRooms).where(eq(voiceRooms.channelId, newState.channelId));
    if (isTemp.length > 0) {
      VoiceService.cancelScheduledDelete(newState.channelId);
      await VoiceService.addVoiceLog(guild, newState.channelId, member, 'masuk');
    }
  }

  // 3. Logika Keluar Room (Smart Cleanup & Log & Ownership)
  if (oldState.channelId && oldState.channelId !== newState.channelId) {
    const oldChannel = oldState.channel as VoiceChannel;
    const [room] = await db.select().from(voiceRooms).where(eq(voiceRooms.channelId, oldState.channelId));
    
    if (room) {
      await VoiceService.addVoiceLog(guild, oldState.channelId, member, 'keluar');

      if (oldChannel.members.size === 0) {
        VoiceService.scheduleDelete(oldChannel);
      } else if (member.id === room.ownerId) {
        const newOwner = oldChannel.members.first();
        if (newOwner) {
          await db.update(voiceRooms).set({ ownerId: newOwner.id }).where(eq(voiceRooms.channelId, oldChannel.id));
          await oldChannel.permissionOverwrites.edit(newOwner.id, {
            ManageChannels: true, MoveMembers: true, MuteMembers: true, DeafenMembers: true
          });
        }
      }
    }
  }
}
