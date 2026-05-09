import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { sendRawReply } from "../../../shared/utils/type17.js";
import { Colors } from "../../../core/constants.js";

export const data = new SlashCommandBuilder()
  .setName("serverinfo")
  .setDescription(".");

export async function execute(interaction: ChatInputCommandInteraction) {
  const { guild } = interaction;
  if (!guild) return;

  const content = [
    `**Nama:** ${guild.name}`,
    `**ID:** ${guild.id}`,
    `**Owner:** <@${guild.ownerId}>`,
    `**Total Member:** ${guild.memberCount}`,
    `**Dibuat Pada:** <t:${Math.floor(guild.createdTimestamp / 1000)}:F>`,
    `**Boost Level:** Level ${guild.premiumTier}`,
  ].join("\n");

  await sendRawReply(
    interaction,
    content,
    `Server Info: ${guild.name}`,
    Colors.Primary,
  );
}
