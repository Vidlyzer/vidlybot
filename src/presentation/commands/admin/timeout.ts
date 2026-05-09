import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  PermissionFlagsBits,
} from "discord.js";
import { logAction } from "../../../infrastructure/logger/logger.js";
import { sendRawReply } from "../../../shared/utils/type17.js";
import { Colors } from "../../../core/constants.js";

export const data = new SlashCommandBuilder()
  .setName("timeout")
  .setDescription(".")
  .addUserOption((option) =>
    option
      .setName("target")
      .setDescription("User yang akan di-timeout")
      .setRequired(true),
  )
  .addIntegerOption((option) =>
    option
      .setName("duration")
      .setDescription("Durasi dalam menit")
      .setRequired(true)
      .addChoices(
        { name: "60 Detik", value: 1 },
        { name: "5 Menit", value: 5 },
        { name: "10 Menit", value: 10 },
        { name: "1 Jam", value: 60 },
        { name: "1 Hari", value: 1440 },
        { name: "1 Minggu", value: 10080 },
      ),
  )
  .addStringOption((option) =>
    option.setName("reason").setDescription("Alasan timeout").setRequired(true),
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers);

export async function execute(interaction: ChatInputCommandInteraction) {
  const target = interaction.options.getMember("target") as any;
  const duration = interaction.options.getInteger("duration")!;
  const reason = interaction.options.getString("reason")!;

  if (!target) {
    return sendRawReply(
      interaction,
      "Member tidak ditemukan.",
      "Timeout Gagal",
      Colors.Error,
      true,
    );
  }

  if (!target.moderatable) {
    return sendRawReply(
      interaction,
      "Saya tidak memiliki izin untuk melakukan timeout pada member ini.",
      "Timeout Ditolak",
      Colors.Error,
      true,
    );
  }

  try {
    await target.timeout(duration * 60 * 1000, reason);

    await sendRawReply(
      interaction,
      `**Target:** ${target.user.tag}\n**Durasi:** ${duration} menit\n**Alasan:** ${reason}`,
      "[⚙] Timeout Diterapkan",
      Colors.Warn,
    );

    await logAction(
      interaction.client,
      interaction.guildId!,
      "warn",
      "Timeout Member",
      `Target: ${target.user.tag} (${target.id})\nModerator: ${interaction.user.tag}\nDurasi: ${duration}m\nAlasan: ${reason}`,
      Colors.Warn,
    );
  } catch (error) {
    console.error(error);
    await sendRawReply(
      interaction,
      "Gagal menerapkan timeout.",
      "Timeout Error",
      Colors.Error,
      true,
    );
  }
}
