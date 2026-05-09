import { type InteractionReplyOptions, Routes } from 'discord.js';

/**
 * Mengirim balasan interaksi secara "Raw" tanpa judul (Minimalist).
 */
export async function sendRawReply(interaction: any, content: string, _title?: string, color: number = 0x2f3136, ephemeral: boolean = false) {
  const flags = ephemeral ? (32768 | 64) : 32768;
  const payload = {
    type: 4,
    data: {
      flags: flags,
      components: [{
        type: 17,
        accent_color: null,
        spoiler: false,
        components: [
          { type: 14, spacing: 1, divider: false },
          {
            type: 10, // TextDisplay
            content: content,
          },
          { type: 14, spacing: 1, divider: false },
        ],
      }],
    },
  };
  try {
    if (interaction.replied || interaction.deferred) {
      await interaction.client.rest.patch(Routes.webhookMessage(interaction.client.user.id, interaction.token, '@original'), { body: payload.data });
    } else {
      await interaction.client.rest.post(Routes.interactionCallback(interaction.id, interaction.token), { body: payload });
    }
  } catch (error) {
    console.error('[X] Error sending Raw Type 17 Reply:', error);
  }
}

/**
 * Mengirim pesan ke channel tanpa judul.
 */
export async function sendRawMessage(channel: any, content: string, _title?: string, color: number = 0x2f3136) {
  const payload = {
    flags: 32768,
    components: [{
      type: 17,
      accent_color: null,
      spoiler: false,
      components: [
        { type: 14, spacing: 1, divider: false },
        {
          type: 10,
          content: content,
        },
        { type: 14, spacing: 1, divider: false },
      ],
    }],
  };
  try {
    return await channel.client.rest.post(Routes.channelMessages(channel.id), { body: payload });
  } catch (error) {
    console.error('[X] Error sending Raw Type 17 Message:', error);
  }
}

/**
 * Menghasilkan opsi respons Type 17 standar tanpa judul.
 */
export function createType17Response(content: string, _title?: string, color: number = 0x2f3136, ephemeral: boolean = false): InteractionReplyOptions {
  const flags = ephemeral ? (32768 | 64) : 32768;
  return {
    flags: flags as any,
    components: [{
      type: 17,
      accent_color: null,
      spoiler: false,
      components: [
        { type: 14, spacing: 1, divider: false },
        { type: 10, content: content },
        { type: 14, spacing: 1, divider: false },
      ]
    }] as any
  };
}

/**
 * Menghasilkan payload Raw untuk Media (Banner).
 */
export function createRawMessage(content: string, title?: string, color: number = 0x2f3136) {
  return createType17Response(content, title, color);
}

export function createType17MediaResponse(content: string, imageUrl: string, ephemeral: boolean = false): any {
  const flags = ephemeral ? (32768 | 64) : 32768;
  return {
    flags: flags,
    components: [{
      type: 17,
      accent_color: null,
      components: [
        { type: 14, spacing: 1, divider: false },
        { type: 12, items: [{ media: { url: imageUrl } }] },
        { type: 14, spacing: 1, divider: true },
        { type: 10, content: content },
        { type: 14, spacing: 1, divider: false },
      ]
    }]
  };
}
