import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { db } from "../../../infrastructure/database/db.js";
import { users } from "../../../infrastructure/database/schema.js";
import { eq, and } from "drizzle-orm";
import { createType17MediaResponse } from "../../../shared/utils/type17.js";
import { EconomyService } from "../../../application/services/economy.service.js";
import { BOT_CONFIG } from "../../../core/config.js";

export const data = new SlashCommandBuilder()
  .setName("profile")
  .setDescription(".")
  .addUserOption((option) =>
    option.setName("target").setDescription("User yang ingin dicek"),
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  // PENTING: Gunakan standar discord.js agar tidak timeout
  await interaction.deferReply();

  const target = interaction.options.getUser("target") || interaction.user;
  const member = await interaction.guild?.members
    .fetch(target.id)
    .catch(() => null);

  try {
    const [userData] = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.userId, target.id),
          eq(users.guildId, interaction.guildId!),
        ),
      );

    if (!userData) {
      return await interaction.editReply({
        content: `[*] **${target.username}** belum memiliki data profil.`,
      });
    }

    const hours = Math.floor(userData.voiceTime / 60);
    const mins = userData.voiceTime % 60;
    const voiceTimeFormatted = hours > 0 ? `${hours}j ${mins}m` : `${mins}m`;

    const content = [
      `**Username:** ${target.tag}`,
      `**ID:** \`${target.id}\``,
      `**Bergabung Discord:** <t:${Math.floor(target.createdTimestamp / 1000)}:R>`,
      `**Bergabung Server:** ${member ? `<t:${Math.floor(member.joinedTimestamp! / 1000)}:R>` : "Bukan member"}`,
      "",
      `**XP:** \`${userData.xp}\``,
      `**Saldo:** \`${EconomyService.formatRupiah(Number(userData.balance))}\``,
      `**Lama di Voice:** \`${voiceTimeFormatted}\``,
    ].join("\n");

    // Gunakan editReply dengan struktur Type 17 manual
    const bannerUrl =
      "https://cdn.discordapp.com/attachments/1237802179595735071/1500590899070242966/profile.png?ex=69f8fdad&is=69f7ac2d&hm=30c67211e45bd54aae2b69949a1535167ce2f4ee7e5fe3aebdaee37722042bcc&";
    await interaction.editReply(
      createType17MediaResponse(content, bannerUrl) as any,
    );
  } catch (error: any) {
    console.error("[PROFILE ERROR]:", error);
    await interaction.editReply({ content: "[x] Gagal mengambil profil." });
  }
}
