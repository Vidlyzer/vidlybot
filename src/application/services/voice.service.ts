import { 
  VoiceChannel, 
  GuildMember, 
  ChannelType, 
  PermissionFlagsBits, 
  Client, 
  TextChannel,
  Guild
} from 'discord.js';
import { db } from '../../infrastructure/database/db.js';
import { voiceRooms } from '../../infrastructure/database/schema.js';
import { eq } from 'drizzle-orm';
import { BOT_CONFIG } from '../../core/config.js';
import { SYSTEM_MESSAGES } from '../../core/messages.js';

const deleteTimeouts = new Map<string, NodeJS.Timeout>();
const cooldowns = new Map<string, number>();

export class VoiceService {
  // ==================== Cooldown ====================
  static isOnCooldown(userId: string): boolean {
    const lastUsed = cooldowns.get(userId);
    if (!lastUsed) return false;
    return Date.now() - lastUsed < BOT_CONFIG.tempVoice.cooldown;
  }

  static setCooldown(userId: string) {
    cooldowns.set(userId, Date.now());
    setTimeout(() => cooldowns.delete(userId), BOT_CONFIG.tempVoice.cooldown);
  }

  // ==================== Smart Cleanup ====================
  static scheduleDelete(channel: VoiceChannel) {
    if (deleteTimeouts.has(channel.id)) return;

    const timeout = setTimeout(async () => {
      deleteTimeouts.delete(channel.id);
      try {
        const fresh = await channel.guild.channels.fetch(channel.id).catch(() => null) as VoiceChannel;
        if (!fresh || fresh.members.size > 0) return;

        await this.deleteTempChannel(fresh);
        console.log(`[TempVoice] Smart cleanup: deleted #${channel.name}`);
      } catch (error) {
        console.error("[TempVoice] Smart cleanup error:", error);
      }
    }, BOT_CONFIG.tempVoice.emptyTimeout);

    deleteTimeouts.set(channel.id, timeout);
  }

  static cancelScheduledDelete(channelId: string) {
    const timeout = deleteTimeouts.get(channelId);
    if (timeout) {
      clearTimeout(timeout);
      deleteTimeouts.delete(channelId);
    }
  }

  // ==================== Channel Operations ====================
  static async createTempChannel(member: GuildMember, triggerChannel: VoiceChannel) {
    const guild = member.guild;
    
    // Resolve Access Role
    const accessRole = guild.roles.cache.get(BOT_CONFIG.tempVoice.accessRoleId) ||
      guild.roles.cache.find(r => r.name.toLowerCase() === 'vidlyrian' || r.name.toLowerCase() === 'vidlyzer');

    const permissionOverwrites: any[] = [
      {
        id: guild.roles.everyone.id,
        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory],
        deny: [PermissionFlagsBits.Connect, PermissionFlagsBits.SendMessages],
      },
      {
        id: member.id,
        allow: [
          PermissionFlagsBits.ManageChannels,
          PermissionFlagsBits.MoveMembers,
          PermissionFlagsBits.MuteMembers,
          PermissionFlagsBits.DeafenMembers,
          PermissionFlagsBits.Connect,
          PermissionFlagsBits.Speak,
          PermissionFlagsBits.Stream,
        ],
      },
    ];

    if (accessRole) {
      permissionOverwrites.push({
        id: accessRole.id,
        allow: [
          PermissionFlagsBits.Connect,
          PermissionFlagsBits.Speak,
          PermissionFlagsBits.Stream,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.UseSoundboard,
          (PermissionFlagsBits as any).SetVoiceChannelStatus || (1n << 48n),
          PermissionFlagsBits.EmbedLinks,
          PermissionFlagsBits.AttachFiles,
          PermissionFlagsBits.AddReactions,
          PermissionFlagsBits.UseExternalEmojis,
          PermissionFlagsBits.MentionEveryone,
          PermissionFlagsBits.SendVoiceMessages,
          PermissionFlagsBits.UseApplicationCommands,
          (PermissionFlagsBits as any).UseEmbeddedActivities || (PermissionFlagsBits as any).StartEmbeddedActivities,
          (PermissionFlagsBits as any).UseExternalApps || 0n,
        ],
      });
    }

    // Buat channel
    console.log(`[*] Creating temp channel for ${member.user.tag}...`);
    const tempChannel = await guild.channels.create({
      name: `╰-${member.displayName} room's`,
      type: ChannelType.GuildVoice,
      parent: BOT_CONFIG.tempVoice.tempVoiceCategoryId || null,
      bitrate: guild.maximumBitrate,
      permissionOverwrites,
    });

    // Save to Database
    await db.insert(voiceRooms).values({
      guildId: guild.id,
      channelId: tempChannel.id,
      ownerId: member.id,
    });

    // Pindahkan user (dengan sedikit delay agar Discord siap)
    setTimeout(async () => {
      try {
        if (member.voice.channelId) {
          await member.voice.setChannel(tempChannel);
          console.log(`[V] Moved ${member.user.tag} to ${tempChannel.name}`);
        }
      } catch (e) {
        console.error(`[X] Failed to move ${member.user.tag}:`, e);
      }
    }, 500);

    await this.sendCreateLog(guild, member, tempChannel);

    return tempChannel;
  }

  static async deleteTempChannel(channel: VoiceChannel) {
    this.cancelScheduledDelete(channel.id);
    await db.delete(voiceRooms).where(eq(voiceRooms.channelId, channel.id));
    if (channel.deletable) {
      await channel.delete("TempVoice: Channel dihapus");
    }
  }

  // ==================== Logging ====================
  static async sendCreateLog(guild: Guild, member: GuildMember, channel: VoiceChannel) {
    try {
      const logChannel = await guild.channels.fetch(BOT_CONFIG.tempVoice.logChannelId).catch(() => null) as TextChannel;
      if (!logChannel) {
        console.warn(`[!] Log channel ${BOT_CONFIG.tempVoice.logChannelId} not found!`);
        return;
      }

      const waktu = new Intl.DateTimeFormat('id-ID', {
        timeZone: 'Asia/Jakarta',
        weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
        hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
      }).format(new Date()).replace(':', '.');

      const logContent = SYSTEM_MESSAGES.logs.voiceCreateBody
        .replace('{member}', member.toString())
        .replace('{name}', channel.name)
        .replace('{bitrate}', (channel.bitrate / 1000).toString())
        .replace('{limit}', channel.userLimit ? `\`${channel.userLimit}\`` : "\`∞\`")
        .replace('{time}', waktu);

      const rawComponents = [
        {
          type: 17,
          components: [
            { type: 12, items: [{ media: { url: BOT_CONFIG.tempVoice.bannerUrl } }] },
            { type: 14, spacing: 1, divider: false },
            { type: 10, content: logContent },
          ],
          accent_color: null, spoiler: false,
        },
      ];

      const logMsg = await logChannel.send({
        flags: 1 << 15,
        components: rawComponents as any,
      });

      await db.update(voiceRooms).set({
        logMessageId: logMsg.id,
        logContent: logContent,
        history: [],
      }).where(eq(voiceRooms.channelId, channel.id));

    } catch (error) {
      console.error("[TempVoice] Gagal mengirim log:", error);
    }
  }

  static async addVoiceLog(guild: Guild, channelId: string, member: GuildMember, action: 'masuk' | 'keluar') {
    try {
      const [room] = await db.select().from(voiceRooms).where(eq(voiceRooms.channelId, channelId));
      if (!room || !room.logMessageId) return;

      const logChannel = await guild.channels.fetch(BOT_CONFIG.tempVoice.logChannelId).catch(() => null) as TextChannel;
      if (!logChannel) return;

      const message = await logChannel.messages.fetch(room.logMessageId).catch(() => null);
      if (!message) return;

      const time = new Intl.DateTimeFormat('id-ID', {
        timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
      }).format(new Date()).replace('.', ':');

      const symbol = action === 'masuk' ? '↓' : '↑';
      const displayName = member.displayName || "Unknown";
      const truncatedName = displayName.length > 10 ? displayName.substring(0, 7) + "..." : displayName.padEnd(10, " ");
      const entry = `${symbol} ${truncatedName} ${time}`;

      const rawHistory = room.history;
      const history = Array.isArray(rawHistory) ? rawHistory : [];
      history.push(entry);
      if (history.length > 50) history.shift();

      await db.update(voiceRooms).set({ history }).where(eq(voiceRooms.channelId, channelId));

      const rows = [];
      for (let i = 0; i < history.length; i += 4) {
        rows.push(history.slice(i, i + 4).join(" | "));
      }

      const newContent = `${room.logContent}\n\n${"━".repeat(35)}\n**${SYSTEM_MESSAGES.logs.voiceHistoryHeader}**\n${rows.join("\n")}`;

      const rawComponents = [
        {
          type: 17,
          components: [
            { type: 12, items: [{ media: { url: BOT_CONFIG.tempVoice.bannerUrl } }] },
            { type: 14, spacing: 1, divider: false },
            { type: 10, content: newContent },
          ],
          accent_color: null, spoiler: false,
        },
      ];

      await message.edit({
        flags: 1 << 15,
        components: rawComponents as any,
      });
    } catch (error) {
      console.error("[TempVoice] Gagal update log:", error);
    }
  }

  static async startupCleanup(client: Client) {
    const allRooms = await db.select().from(voiceRooms);
    console.log(`[TempVoice] Cleaning up ${allRooms.length} tracked channel(s)...`);

    for (const room of allRooms) {
      try {
        const channel = await client.channels.fetch(room.channelId).catch(() => null) as VoiceChannel;
        if (channel && channel.name.startsWith(BOT_CONFIG.tempVoice.prefix)) {
          await channel.delete("Startup Cleanup");
        }
      } catch (e) {
        console.error(`[TempVoice] Failed to cleanup ${room.channelId}:`, e);
      }
    }
    await db.delete(voiceRooms);
    console.log("[TempVoice] Startup cleanup completed.");
  }
}
