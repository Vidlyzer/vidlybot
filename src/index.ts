import 'dotenv/config';
import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath, pathToFileURL } from 'url';
import { 
  Client, GatewayIntentBits, Collection, REST, Routes 
} from 'discord.js';
import { db } from './infrastructure/database/db.js';
import { voiceRooms, botStatus } from './infrastructure/database/schema.js';
import { eq } from 'drizzle-orm';
import { BOT_CONFIG } from './core/config.js';
import { SYSTEM_MESSAGES } from './core/messages.js';
import { EconomyService } from './application/services/economy.service.js';
import { sendRawMessage } from './shared/utils/type17.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates,
  ],
}) as any;

client.commands = new Collection();

// 🛡️ Anti-Collision Logic
const instanceName = process.env.INSTANCE_NAME || 'Unknown-Instance';

const checkCollision = async () => {
  const [currentStatus] = await db.select().from(botStatus).where(eq(botStatus.id, 1));
  
  if (currentStatus) {
    const now = new Date();
    const lastActive = new Date(currentStatus.lastHeartbeat);
    const diffSeconds = (now.getTime() - lastActive.getTime()) / 1000;

    if (diffSeconds < 30 && currentStatus.instanceName !== instanceName) {
      console.error(`[FATAL] Bot is already running on instance: ${currentStatus.instanceName}`);
      console.error(`[FATAL] This instance (${instanceName}) will exit to prevent double responses.`);
      process.exit(1);
    }
  }

  await db.insert(botStatus).values({
    id: 1,
    instanceName: instanceName,
    lastHeartbeat: new Date(),
  }).onDuplicateKeyUpdate({
    set: {
      instanceName: instanceName,
      lastHeartbeat: new Date(),
    }
  });

  console.log(`[+] Instance Lock Acquired: Running as ${instanceName}`);
  
  setInterval(async () => {
    await db.update(botStatus).set({ lastHeartbeat: new Date() }).where(eq(botStatus.id, 1));
  }, 10000);
};

// 📂 Recursive Command Loader
const loadCommands = async (dir: string) => {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      await loadCommands(fullPath);
    } else if (file.endsWith('.ts') || file.endsWith('.js')) {
      const filePath = pathToFileURL(fullPath).href;
      try {
        const command = await import(filePath);
        if ('data' in command && 'execute' in command) {
          client.commands.set(command.data.name, command);
        }
      } catch (err) {
        console.error(`[X] Failed to load command ${file}:`, err);
      }
    }
  }
};

// 🚀 Startup Process
(async () => {
  await checkCollision();
  console.log('[*] Bot process starting...');
  await loadCommands(path.join(__dirname, 'presentation', 'commands'));
  console.log(`[+] Loaded commands: ${Array.from(client.commands.keys()).join(', ')}`);
  
  // Auto-Deploy Slash Commands
  const commandsJSON = client.commands.map((c: any) => c.data.toJSON());
  const rest = new REST().setToken(process.env.DISCORD_TOKEN!);

  try {
    if (BOT_CONFIG.guildId && BOT_CONFIG.guildId !== 'MASUKKAN_ID_SERVER_DI_SINI') {
      console.log(`[*] Auto-Deploy: Running in INSTANT GUILD MODE for ${BOT_CONFIG.guildId}`);
      await rest.put(Routes.applicationCommands(BOT_CONFIG.clientId), { body: [] });
      await rest.put(Routes.applicationGuildCommands(BOT_CONFIG.clientId, BOT_CONFIG.guildId), { body: commandsJSON });
      console.log('[+] Auto-Deploy: Guild commands reloaded & Global commands cleared.');
    } else {
      console.log(`[*] Auto-Deploy: Running in GLOBAL MODE...`);
      await rest.put(Routes.applicationCommands(BOT_CONFIG.clientId), { body: commandsJSON });
      console.log('[+] Auto-Deploy: Global commands reloaded.');
    }
    console.log('[+] Auto-Deploy: Success.');
  } catch (error) {
    console.error('[X] Auto-Deploy Error:', error);
  }

  // Load Events
  const eventsPath = path.join(__dirname, 'presentation', 'events');
  const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.ts') || file.endsWith('.js'));

  for (const file of eventFiles) {
    const filePath = pathToFileURL(path.join(eventsPath, file)).href;
    try {
      const event = await import(filePath);
      if (event.once) {
        client.once(event.name, (...args: any[]) => event.execute(...args));
      } else {
        client.on(event.name, (...args: any[]) => event.execute(...args));
      }
      console.log(`[+] Loaded event: ${event.name}`);
    } catch (err) {
      console.error(`[X] Failed to load event ${file}:`, err);
    }
  }

  process.on('unhandledRejection', (error) => {
    console.error('[FATAL] Unhandled Promise Rejection:', error);
  });

  process.on('uncaughtException', (error) => {
    console.error('[FATAL] Uncaught Exception:', error);
  });

  client.login(process.env.DISCORD_TOKEN);

  // 🎙️ Periodic Voice Rewards
  setInterval(async () => {
    try {
      const guilds = client.guilds.cache;
      for (const [guildId, guild] of guilds) {
        const voiceStates = guild.voiceStates.cache;
        const channelGroups = new Map<string, string[]>();

        for (const [memberId, state] of voiceStates) {
          if (state.channelId && !state.member?.user.bot) {
            if (!channelGroups.has(state.channelId)) channelGroups.set(state.channelId, []);
            channelGroups.get(state.channelId)!.push(memberId);
          }
        }

        for (const [channelId, members] of channelGroups) {
          for (const memberId of members) {
            await EconomyService.addRewards(memberId, guildId, 10, 5000, BOT_CONFIG.economy.voiceRewardMinutes);
          }

          const [room] = await db.select().from(voiceRooms).where(eq(voiceRooms.channelId, channelId));
          if (room) {
            const channel = await guild.channels.fetch(channelId).catch(() => null);
            if (channel && channel.isVoiceBased()) {
              await sendRawMessage(
                channel as any,
                SYSTEM_MESSAGES.voice.periodicReward.replace('{xp}', '10').replace('{saldo}', '5.000'),
                '',
                BOT_CONFIG.colors.success
              );
            }
          }
        }
      }
    } catch (error) {
      console.error('[X] Periodic Reward Error:', error);
    }
  }, BOT_CONFIG.economy.voiceRewardMinutes * 60000);
})();
