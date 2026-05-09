import { CommandInteraction, SlashCommandBuilder } from "discord.js";
import { sendRawReply } from "../../../shared/utils/type17.js";
import { BOT_CONFIG } from "../../../core/config.js";

export const data = new SlashCommandBuilder().setName("ping").setDescription(".");

export async function execute(interaction: CommandInteraction) {
  await sendRawReply(
    interaction,
    `${BOT_CONFIG.persona.symbols.info} Pong!`,
    "Ping Status",
    BOT_CONFIG.colors.primary,
  );
}
