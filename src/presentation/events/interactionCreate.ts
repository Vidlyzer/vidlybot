import { Interaction, Events } from 'discord.js';
import { handleVoiceButton, handleVoiceModal } from '../../infrastructure/discord/voiceControlHandler.js';
import { sendRawReply } from '../../shared/utils/type17.js';
import { BOT_CONFIG } from '../../core/config.js';

export const name = Events.InteractionCreate;
export const once = false;

export async function execute(interaction: Interaction) {
  if (interaction.isChatInputCommand()) {
    console.log(`[/] Command Received: ${interaction.commandName} by ${interaction.user.tag}`);
    
    const client = interaction.client as any;
    const command = client.commands.get(interaction.commandName);

    if (!command) return;

    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(error);
      if (!interaction.replied && !interaction.deferred) {
        await sendRawReply(interaction, 
          'Terjadi error saat menjalankan command.',
          'Command Error',
          BOT_CONFIG.colors.error,
          true,
        );
      }
    }
    return;
  }

  if (interaction.isButton()) {
    if (interaction.customId.startsWith('vc_') || interaction.customId.startsWith('tv_')) {
      await handleVoiceButton(interaction);
    }
  }

  if (interaction.isModalSubmit()) {
    if (interaction.customId.startsWith('modal_vc_') || interaction.customId.startsWith('modal_tv_')) {
      await handleVoiceModal(interaction);
    }
  }
}
