import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  PermissionFlagsBits,
} from "discord.js";
import { sendRawReply } from "../../../shared/utils/type17.js";
import { Colors } from "../../../core/constants.js";

export const data = new SlashCommandBuilder()
  .setName("changenickname")
  .setDescription("Mengubah nickname user di server")
  .addUserOption((option) =>
    option
      .setName("target")
      .setDescription(
        "User yang akan diubah nicknamenya (kosongkan untuk diri sendiri)",
      )
      .setRequired(false),
  )
  .addStringOption((option) =>
    option
      .setName("nickname")
      .setDescription("Nickname baru (kosongkan untuk reset)")
      .setRequired(false),
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageNicknames);

export async function execute(interaction: ChatInputCommandInteraction) {
  const targetMember = interaction.options.getMember("target") as any;
  const nickname = interaction.options.getString("nickname");

  const member = targetMember ?? interaction.member;

  if (!member) {
    return sendRawReply(
      interaction,
      "Member tidak ditemukan.",
      "Nickname Gagal",
      Colors.Error,
      true,
    );
  }

  if (
    !interaction.guild?.members.me?.permissions.has(
      PermissionFlagsBits.ManageNicknames,
    )
  ) {
    return sendRawReply(
      interaction,
      "Saya tidak memiliki izin untuk mengubah nickname.",
      "Nickname Gagal",
      Colors.Error,
      true,
    );
  }

  const isSelf = !targetMember;
  const canChange = isSelf || member.manageable;

  if (!canChange) {
    return sendRawReply(
      interaction,
      "Saya tidak dapat mengubah nickname user ini.",
      "Nickname Ditolak",
      Colors.Error,
      true,
    );
  }

  try {
    const oldNickname = member.nickname ?? member.user.username;
    const newNickname = nickname?.trim() || null;

    await member.setNickname(newNickname);

    const targetName = isSelf
      ? "Nickname kamu"
      : `Nickname **${targetMember.user.tag}**`;
    const successMsg = newNickname
      ? `${targetName} telah diubah menjadi **${newNickname}**`
      : `${targetName} telah di-reset`;

    await sendRawReply(
      interaction,
      `**Sebelum:** ${oldNickname}\n**Sesudah:** ${newNickname ?? "(default)"}`,
      `[✓] ${isSelf ? "Nickname Diubah" : "Nickname User Diubah"}`,
      Colors.Primary,
    );
  } catch (error) {
    console.error(error);
    await sendRawReply(
      interaction,
      "Gagal mengubah nickname. Mungkin privilege saya lebih rendah dari target.",
      "Nickname Error",
      Colors.Error,
      true,
    );
  }
}
