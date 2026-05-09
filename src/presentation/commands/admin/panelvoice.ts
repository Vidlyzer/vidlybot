import { ChatInputCommandInteraction, SlashCommandBuilder, PermissionFlagsBits, Routes } from "discord.js";
import { BOT_CONFIG } from "../../../core/config.js";
import { sendRawReply } from "../../../shared/utils/type17.js";

export const data = new SlashCommandBuilder()
  .setName("panelvoice")
  .setDescription(".")
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(interaction: ChatInputCommandInteraction) {
  const container = {
    type: 17,
    accent_color: null,
    spoiler: false,
    components: [
      { type: 14, spacing: 1, divider: false },
      {
        type: 12,
        items: [{ media: { url: BOT_CONFIG.tempVoice.bannerUrl } }],
      },
      { type: 14, spacing: 2, divider: true },
      {
        type: 10,
        content: [
          "**Cara pakai :**",
          `1. Join channel <#${BOT_CONFIG.tempVoice.createVoiceChannelId}> untuk membuat room`,
          "2. Gunakan tombol di bawah untuk mengontrol room kamu",
          "",
          "> · Hanya owner room yang bisa mengontrol (kecuali Claim)",
        ].join("\n"),
      },
      { type: 14, spacing: 1, divider: true },
      {
        type: 1,
        components: [
          { type: 2, style: 2, custom_id: "tv_rename", label: "✎ Rename" },
          { type: 2, style: 2, custom_id: "tv_limit", label: "≡ Limit" },
          { type: 2, style: 2, custom_id: "tv_lock", label: "✦ Lock" },
          { type: 2, style: 2, custom_id: "tv_unlock", label: "◇ Unlock" },
          { type: 2, style: 2, custom_id: "tv_claim", label: "⚑ Claim" },
        ],
      },
      {
        type: 1,
        components: [
          { type: 2, style: 2, custom_id: "tv_hide", label: "◌ Hide" },
          { type: 2, style: 2, custom_id: "tv_unhide", label: "◉ Unhide" },
          { type: 2, style: 2, custom_id: "tv_bitrate", label: "♪ Bitrate" },
          { type: 2, style: 2, custom_id: "tv_kick", label: "⊗ Kick" },
          {
            type: 2,
            style: 2,
            custom_id: "tv_leaderboard",
            label: "Leaderboard",
          },
        ],
      },
      { type: 14, spacing: 1, divider: false },
      { type: 10, content: "@here" },
    ],
  };

  try {
    // 1. Kirim panel sebagai PESAN MANDIRI di channel (Bukan balasan)
    await interaction.client.rest.post(
      Routes.channelMessages(interaction.channelId),
      {
        body: {
          flags: 32768,
          components: [container],
        },
      }
    );

    // 2. Balas interaksi secara ephemeral agar tidak "The application did not respond"
    // Tapi buat pesannya sangat minimalis agar tidak terlihat dobel yang mengganggu.
    await sendRawReply(interaction, "Panel berhasil dikirim ke channel ini.", "", 0x43b581, true);

  } catch (error) {
    console.error("[X] Error sending standalone panel:", error);
  }
}
