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
  .setName("kick")
  .setDescription(".")
  .addUserOption((option) =>
    option
      .setName("target")
      .setDescription("User yang akan di-kick")
      .setRequired(true),
  )
  .addStringOption((option) =>
    option.setName("reason").setDescription("Alasan kick").setRequired(true),
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers);

export async function execute(interaction: ChatInputCommandInteraction) {
  const target = interaction.options.getMember("target") as any;
  const reason = interaction.options.getString("reason")!;

  if (!target) {
    return sendRawReply(
      interaction,
      "Member tidak ditemukan.",
      "Kick Gagal",
      Colors.Error,
      true,
    );
  }

  if (!target.kickable) {
    return sendRawReply(
      interaction,
      "Saya tidak memiliki izin untuk mengeluarkan member ini.",
      "Kick Ditolak",
      Colors.Error,
      true,
    );
  }

  try {
    let dmStatus = "DM Terkirim";
    try {
      const dmPayload = createRawMessage(
        `[!] Anda telah dikeluarkan dari **${interaction.guild?.name}**.\n**Alasan:** ${reason}`,
        "Status Moderasi",
        Colors.Error,
      ) as any;
      delete dmPayload.flags;
      await target.send(dmPayload);
    } catch (e) {
      dmStatus = "Gagal DM (Privasi Tertutup)";
    }

    await target.kick(reason);

    await sendRawReply(
      interaction,
      `**Target:** ${target.user.tag}\n**Alasan:** ${reason}\n**Status DM:** ${dmStatus}`,
      "[-] Member Dikeluarkan",
      Colors.Error,
    );

    await logAction(
      interaction.client,
      interaction.guildId!,
      "error",
      "Kick Member",
      `Target: ${target.user.tag} (${target.id})\nModerator: ${interaction.user.tag}\nAlasan: ${reason}\nDM Status: ${dmStatus}`,
      Colors.Error,
    );
  } catch (error) {
    console.error(error);
    await sendRawReply(
      interaction,
      "Gagal mengeluarkan member.",
      "Kick Error",
      Colors.Error,
      true,
    );
  }
}
