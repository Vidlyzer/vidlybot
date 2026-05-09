import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  PermissionFlagsBits,
} from "discord.js";
import { logAction } from "../../../infrastructure/logger/logger.js";
import {
  createRawMessage,
  sendRawReply,
} from "../../../shared/utils/type17.js";
import { Colors } from "../../../core/constants.js";

export const data = new SlashCommandBuilder()
  .setName("ban")
  .setDescription(".")
  .addUserOption((option) =>
    option
      .setName("target")
      .setDescription("User yang akan di-ban")
      .setRequired(true),
  )
  .addStringOption((option) =>
    option.setName("reason").setDescription("Alasan ban").setRequired(true),
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers);

export async function execute(interaction: ChatInputCommandInteraction) {
  const target = interaction.options.getUser("target")!;
  const reason = interaction.options.getString("reason")!;
  const member = interaction.guild?.members.cache.get(target.id);

  if (member && !member.bannable) {
    return sendRawReply(
      interaction,
      "Saya tidak memiliki izin untuk memblokir member ini.",
      "Ban Ditolak",
      Colors.Error,
      true,
    );
  }

  try {
    let dmStatus = "DM Terkirim";
    try {
      const dmPayload = createRawMessage(
        `[!] Anda telah diblokir secara permanen dari **${interaction.guild?.name}**.\n**Alasan:** ${reason}`,
        "Status Moderasi",
        Colors.Error,
      ) as any;
      delete dmPayload.flags; // MessageFlags.Ephemeral tidak diizinkan di target.send()
      await target.send(dmPayload);
    } catch (e) {
      dmStatus = "Gagal DM (Privasi Tertutup)";
    }

    await interaction.guild?.members.ban(target, { reason });

    await sendRawReply(
      interaction,
      `**Target:** ${target.tag}\n**Alasan:** ${reason}\n**Status DM:** ${dmStatus}`,
      "[-] Member Diblokir",
      Colors.Error,
    );

    await logAction(
      interaction.client,
      interaction.guildId!,
      "error",
      "Ban Member",
      `Target: ${target.tag} (${target.id})\nModerator: ${interaction.user.tag}\nAlasan: ${reason}\nDM Status: ${dmStatus}`,
      Colors.Error,
    );
  } catch (error) {
    console.error(error);
    await sendRawReply(
      interaction,
      "Gagal memblokir member.",
      "Ban Error",
      Colors.Error,
      true,
    );
  }
}
