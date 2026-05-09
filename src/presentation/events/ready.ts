import { Client, Events } from 'discord.js';
import { BOT_CONFIG } from '../../core/config.js';
import { SYSTEM_MESSAGES } from '../../core/messages.js';
import { VoiceService } from '../../application/services/voice.service.js';

export const name = Events.ClientReady;
export const once = true;

export function execute(client: Client) {
  console.log(`[+] SUCCESS: Logged in as ${client.user?.tag}`);
  console.log(`[*] Bot is serving in ${client.guilds.cache.size} servers.`);

  // Startup Cleanup TempVoice
  VoiceService.startupCleanup(client);

  // Set Bot Status dari Config
  client.user?.setPresence({
    activities: [{ 
      name: BOT_CONFIG.persona.status.text, 
      type: BOT_CONFIG.persona.status.type 
    }],
    status: BOT_CONFIG.persona.status.state as any,
  });
}
