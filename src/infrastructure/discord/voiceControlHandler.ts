import { ButtonInteraction, ModalSubmitInteraction, PermissionFlagsBits, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, VoiceChannel } from 'discord.js';
import { db } from '../database/db.js';
import { voiceRooms, users } from '../database/schema.js';
import { eq, sql, and } from 'drizzle-orm';
import { logAction } from '../logger/logger.js';
import { BOT_CONFIG } from '../../core/config.js';
import { createType17MediaResponse, sendRawReply } from '../../shared/utils/type17.js';

async function getOwnedChannel(interaction: ButtonInteraction | ModalSubmitInteraction) {
  const [room] = await db.select().from(voiceRooms).where(eq(voiceRooms.ownerId, interaction.user.id));
  if (!room) return null;

  const guild = interaction.client.guilds.cache.get(room.guildId);
  if (!guild) return null;

  const channel = await guild.channels.fetch(room.channelId).catch(() => null) as VoiceChannel;
  return channel;
}

export async function handleVoiceButton(interaction: ButtonInteraction) {
  // Claim logic has a different context (user doesn't need to own it yet)
  if (interaction.customId === 'tv_claim') {
    const member = interaction.member as any;
    const voiceChannel = member.voice.channel as VoiceChannel;

    if (!voiceChannel) {
      return sendRawReply(interaction, 'Anda harus berada di dalam room untuk melakukan Claim.', '', 0, true);
    }

    const [room] = await db.select().from(voiceRooms).where(eq(voiceRooms.channelId, voiceChannel.id));
    if (!room) {
      return sendRawReply(interaction, 'Ini bukan room sementara yang valid.', '', 0, true);
    }

    // Check if owner is still in the channel
    const ownerInChannel = voiceChannel.members.has(room.ownerId);
    if (ownerInChannel) {
      return sendRawReply(interaction, 'Pemilik room masih berada di dalam channel.', '', 0, true);
    }

    // Process Claim
    await db.update(voiceRooms).set({ ownerId: interaction.user.id }).where(eq(voiceRooms.channelId, voiceChannel.id));
    
    // Update Permissions
    await voiceChannel.permissionOverwrites.edit(interaction.user.id, { 
      ManageChannels: true, 
      MoveMembers: true 
    });
    
    // Remove old owner permissions if possible
    const oldOwner = await interaction.guild?.members.fetch(room.ownerId).catch(() => null);
    if (oldOwner) {
      await voiceChannel.permissionOverwrites.delete(oldOwner.id).catch(() => {});
    }

    return sendRawReply(interaction, 'Anda sekarang adalah pemilik baru dari room ini!', '', 0x43b581, true);
  }

  const channel = await getOwnedChannel(interaction);
  
  if (!channel && interaction.customId !== 'tv_leaderboard') {
    return sendRawReply(interaction, 'Room Anda tidak ditemukan atau sudah dihapus.', '', 0, true);
  }

  switch (interaction.customId) {
    case 'vc_lock':
    case 'tv_lock':
      if (!channel) return;
      const isLocked = channel.permissionOverwrites.cache.get(channel.guild.roles.everyone.id)?.deny.has(PermissionFlagsBits.Connect);
      await channel.permissionOverwrites.edit(channel.guild.roles.everyone, { Connect: isLocked ? null : false });
      await sendRawReply(interaction, `Room sekarang ${isLocked ? 'terbuka' : 'dikunci'}.`, '', 0, true);
      break;

    case 'tv_unlock':
      if (!channel) return;
      await channel.permissionOverwrites.edit(channel.guild.roles.everyone, { Connect: null });
      await sendRawReply(interaction, `Room sekarang terbuka untuk semua orang.`, '', 0, true);
      break;

    case 'vc_rename':
    case 'tv_rename':
      if (!channel) return;
      const renameModal = new ModalBuilder().setCustomId('modal_vc_rename').setTitle('Rename Room');
      const nameInput = new TextInputBuilder().setCustomId('new_name').setLabel('Nama Baru').setStyle(TextInputStyle.Short).setPlaceholder(channel.name).setRequired(true);
      renameModal.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(nameInput));
      await interaction.showModal(renameModal);
      break;

    case 'vc_limit':
    case 'tv_limit':
      if (!channel) return;
      const limitModal = new ModalBuilder().setCustomId('modal_vc_limit').setTitle('Set Limit');
      const limitInput = new TextInputBuilder().setCustomId('user_limit').setLabel('Jumlah Maksimal (0 - 99)').setStyle(TextInputStyle.Short).setPlaceholder('0 untuk tanpa batas').setRequired(true);
      limitModal.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(limitInput));
      await interaction.showModal(limitModal);
      break;

    case 'tv_bitrate':
      if (!channel) return;
      const bitrateModal = new ModalBuilder().setCustomId('modal_vc_bitrate').setTitle('Set Bitrate');
      const bitrateInput = new TextInputBuilder().setCustomId('bitrate_val').setLabel('Bitrate (kbps)').setStyle(TextInputStyle.Short).setPlaceholder(`Maks: ${channel.guild.maximumBitrate / 1000}`).setRequired(true);
      bitrateModal.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(bitrateInput));
      await interaction.showModal(bitrateModal);
      break;

    case 'vc_kick':
    case 'tv_kick':
      if (!channel) return;
      const kickModal = new ModalBuilder().setCustomId('modal_vc_kick').setTitle('Kick Member dari Voice');
      const targetInput = new TextInputBuilder().setCustomId('target_id').setLabel('User ID yang ingin dikeluarkan').setStyle(TextInputStyle.Short).setPlaceholder('Masukkan ID User...').setRequired(true);
      kickModal.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(targetInput));
      await interaction.showModal(kickModal);
      break;
      
    case 'tv_hide':
      if (!channel) return;
      await channel.permissionOverwrites.edit(channel.guild.roles.everyone, { ViewChannel: false });
      await sendRawReply(interaction, `Room disembunyikan dari publik.`, '', 0, true);
      break;
      
    case 'tv_unhide':
      if (!channel) return;
      await channel.permissionOverwrites.edit(channel.guild.roles.everyone, { ViewChannel: null });
      await sendRawReply(interaction, `Room kembali terlihat oleh publik.`, '', 0, true);
      break;
      
    case 'tv_delete':
      if (!channel) return;
      await sendRawReply(interaction, `Room telah dihapus secara manual.`, '', 0, true);
      await channel.delete();
      break;

    case 'tv_leaderboard':
      try {
        const topUsers = await db.select()
          .from(users)
          .orderBy(sql`${users.voiceTime} DESC`)
          .limit(10);

        if (topUsers.length === 0) {
          return sendRawReply(interaction, 'Belum ada data leaderboard.', '', 0, true);
        }

        const lbContent = topUsers.map((u: any, i: number) => {
          const hours = Math.floor(u.voiceTime / 60);
          const mins = u.voiceTime % 60;
          const timeStr = hours > 0 ? `${hours}j ${mins}m` : `${mins}m`;
          return `${i + 1}. <@${u.userId}> - \`${timeStr}\``;
        }).join('\n');

        const lbBanner = 'https://cdn.discordapp.com/attachments/1237802179595735071/1500714446283083886/Leaderboard.png?ex=69f970bd&is=69f81f3d&hm=1b62d837526039e14108e6d77f476ad0167d0a9fe7e001ddbded51a8ecd39cb1&';
        await interaction.reply(createType17MediaResponse(lbContent, lbBanner, true) as any);
      } catch (e) {
        console.error(e);
        await sendRawReply(interaction, 'Gagal mengambil leaderboard.', '', 0, true);
      }
      break;
  }
}

export async function handleVoiceModal(interaction: ModalSubmitInteraction) {
  const channel = await getOwnedChannel(interaction);
  if (!channel) return sendRawReply(interaction, 'Room tidak ditemukan.', '', 0, true);

  if (interaction.customId === 'modal_vc_kick') {
    const targetId = interaction.fields.getTextInputValue('target_id');
    const member = await channel.guild.members.fetch(targetId).catch(() => null);
    if (!member || member.voice.channelId !== channel.id) return sendRawReply(interaction, 'User tidak ditemukan.', '', 0, true);
    await member.voice.setChannel(null);
    await sendRawReply(interaction, `${member.user.tag} dikeluarkan.`, '', 0, true);
  }

  if (interaction.customId === 'modal_vc_rename') {
    const newName = interaction.fields.getTextInputValue('new_name');
    await channel.setName(newName);
    await sendRawReply(interaction, `Nama diubah: **${newName}**`, '', 0, true);
  }

  if (interaction.customId === 'modal_vc_limit') {
    const limit = parseInt(interaction.fields.getTextInputValue('user_limit'));
    if (isNaN(limit) || limit < 0 || limit > 99) return sendRawReply(interaction, 'Angka 0-99.', '', 0, true);
    await channel.setUserLimit(limit);
    await sendRawReply(interaction, `Batas: **${limit === 0 ? '∞' : limit}**`, '', 0, true);
  }

  if (interaction.customId === 'modal_vc_bitrate') {
    const bitrate = parseInt(interaction.fields.getTextInputValue('bitrate_val'));
    const maxBitrate = channel.guild.maximumBitrate / 1000;
    if (isNaN(bitrate) || bitrate < 8 || bitrate > maxBitrate) {
      return sendRawReply(interaction, `Bitrate harus angka antara 8 dan ${maxBitrate} kbps.`, '', 0, true);
    }
    await channel.setBitrate(bitrate * 1000);
    await sendRawReply(interaction, `Bitrate diubah: **${bitrate} kbps**`, '', 0, true);
  }
}
