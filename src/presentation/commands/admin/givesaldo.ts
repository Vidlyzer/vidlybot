import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  PermissionFlagsBits,
} from "discord.js";
import { EconomyService } from "../../../application/services/economy.service.js";
import { sendRawReply } from "../../../shared/utils/type17.js";
import { BOT_CONFIG } from "../../../core/config.js";
import { logAction } from "../../../infrastructure/logger/logger.js";

export const data = new SlashCommandBuilder()
  .setName('givesaldo')
  .setDescription('.')
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
  .addSubcommand((sub) =>
    sub
      .setName("user")
      .setDescription("Berikan saldo ke user spesifik")
      .addUserOption((opt) =>
        opt.setName("target").setDescription("User target").setRequired(true),
      )
      .addIntegerOption((opt) =>
        opt.setName("amount").setDescription("Jumlah saldo").setRequired(true),
      ),
  )
  .addSubcommand((sub) =>
    sub
      .setName("all")
      .setDescription("Berikan saldo ke SEMUA member aktif di database")
      .addIntegerOption((opt) =>
        opt.setName("amount").setDescription("Jumlah saldo").setRequired(true),
      ),
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply();
  const subcommand = interaction.options.getSubcommand();
  const amount = interaction.options.getInteger("amount")!;

  if (amount <= 0) {
    return sendRawReply(
      interaction,
      "[x] Jumlah harus lebih dari 0.",
      "Error",
      BOT_CONFIG.colors.error,
      true,
    );
  }

  try {
    if (subcommand === "user") {
      const target = interaction.options.getUser("target")!;
      await EconomyService.addRewards(
        target.id,
        interaction.guildId!,
        0,
        amount,
      );

      await sendRawReply(
        interaction,
        `[+] Menambahkan \`${EconomyService.formatRupiah(amount)}\` ke saldo **${target.username}**.`,
        "SALDO DITAMBAHKAN",
        BOT_CONFIG.colors.success,
      );
      await logAction(
        interaction.client,
        interaction.guildId!,
        "success",
        "Give Saldo",
        `Admin: ${interaction.user.tag}\nTarget: ${target.tag}\nJumlah: ${EconomyService.formatRupiah(amount)}`,
        BOT_CONFIG.colors.success,
      );
    } else {
      await EconomyService.addRewardsToAll(interaction.guildId!, 0, amount);

      await sendRawReply(
        interaction,
        `[+] Menambahkan \`${EconomyService.formatRupiah(amount)}\` ke saldo **SEMUA** member aktif.`,
        "SALDO MASSAL",
        BOT_CONFIG.colors.success,
      );
      await logAction(
        interaction.client,
        interaction.guildId!,
        "success",
        "Give Saldo Massal",
        `Admin: ${interaction.user.tag}\nJumlah: ${EconomyService.formatRupiah(amount)}`,
        BOT_CONFIG.colors.success,
      );
    }
  } catch (error: any) {
    console.error(error);
    await sendRawReply(
      interaction,
      `[x] Gagal: \`${error.message}\``,
      "Error",
      BOT_CONFIG.colors.error,
      true,
    );
  }
}
