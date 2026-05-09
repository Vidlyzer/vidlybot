import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  PermissionFlagsBits,
} from "discord.js";
import { sendRawReply } from "../../../shared/utils/type17.js";
import { Colors } from "../../../core/constants.js";

export const data = new SlashCommandBuilder()
  .setName("purge")
  .setDescription(".")
  .addIntegerOption((option) =>
    option
      .setName("amount")
      .setDescription("Jumlah pesan (1-100)")
      .setRequired(true)
      .setMinValue(1)
      .setMaxValue(100),
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages);

export async function execute(interaction: ChatInputCommandInteraction) {
  const amount = interaction.options.getInteger("amount")!;

  try {
    const deleted = await (interaction.channel as any).bulkDelete(amount, true);

    await sendRawReply(
      interaction,
      `✅ Berhasil menghapus **${deleted.size}** pesan.`,
      "🧹 Purge Berhasil",
      Colors.Primary,
    );

    // Hapus respons setelah 3 detik
    setTimeout(() => interaction.deleteReply().catch(() => {}), 3000);
  } catch (error) {
    console.error(error);
    await sendRawReply(
      interaction,
      "Gagal menghapus pesan. Mungkin pesan sudah lebih dari 14 hari.",
      "Purge Error",
      Colors.Error,
      true,
    );
  }
}
