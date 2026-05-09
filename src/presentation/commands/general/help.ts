import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { sendRawReply } from "../../../shared/utils/type17.js";
import { BOT_CONFIG } from "../../../core/config.js";

export const data = new SlashCommandBuilder().setName("help").setDescription(".");

export async function execute(interaction: ChatInputCommandInteraction) {
  const s = BOT_CONFIG.persona.symbols;

  const content = [
    `${s.admin} **Moderasi:** Kick, Ban, Timeout, Purge`,
    `${s.voice} **Temp Voice:** Join-to-Create system`,
    `${s.info} **General:** Profile, Userinfo, Serverinfo, Help`,
    `${s.success} **Ekonomi:** XP & Koin aktif (Chat & Voice)`,
    "",
    `> [Panel](${BOT_CONFIG.links.panel}) | [Support](${BOT_CONFIG.links.invite}) | [Site](${BOT_CONFIG.links.website})`,
  ].join("\n");

  await sendRawReply(
    interaction,
    content,
    "VIDLYZER HELP",
    BOT_CONFIG.colors.primary,
  );
}
