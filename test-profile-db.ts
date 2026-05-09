import 'dotenv/config';
import { db } from './src/infrastructure/database/db.js';
import { users } from './src/infrastructure/database/schema.js';
import { eq, and } from 'drizzle-orm';
import { EconomyService } from './src/application/services/economy.service.js';
import { BOT_CONFIG } from './src/core/config.js';

async function testProfile() {
  const targetId = '259267853490847744'; // From the DB output
  const guildId = '739365630251237446';
  
  try {
    const [userData] = await db.select().from(users).where(
      and(eq(users.userId, targetId), eq(users.guildId, guildId))
    );

    console.log("Raw user data:", userData);

    if (!userData) {
      console.log('User not found.');
      process.exit(0);
    }

    const lastActive = userData.lastMessageAt ? `<t:${Math.floor(new Date(userData.lastMessageAt).getTime() / 1000)}:R>` : 'Baru saja bergabung';

    const content = [
      `**User:** TagPlaceholder`,
      `**XP:** \`${userData.xp}\``,
      `**Saldo:** \`${EconomyService.formatRupiah(Number(userData.balance))}\``,
      `**Voice Time:** \`${userData.voiceTime}m\``,
      `**Aktif Terakhir:** ${lastActive}`,
    ].join('\n');

    console.log("Formatted content:\n", content);
  } catch (error) {
    console.error("Error formatting profile:", error);
  }
  process.exit(0);
}

testProfile();
