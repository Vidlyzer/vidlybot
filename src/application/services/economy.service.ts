import { db } from '../../infrastructure/database/db.js';
import { users } from '../../infrastructure/database/schema.js';
import { eq, and, sql } from 'drizzle-orm';
import { BOT_CONFIG } from '../../core/config.js';

export class EconomyService {
  static async setVoiceJoinTime(userId: string, guildId: string) {
    try {
      await db.update(users)
        .set({ voiceJoinedAt: new Date() })
        .where(and(eq(users.userId, userId), eq(users.guildId, guildId)));
    } catch (e) {}
  }

  static async updateVoiceTime(userId: string, guildId: string) {
    try {
      const [user] = await db.select().from(users).where(
        and(eq(users.userId, userId), eq(users.guildId, guildId))
      );

      if (user && user.voiceJoinedAt) {
        const diffMs = Date.now() - user.voiceJoinedAt.getTime();
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins > 0) {
          await db.update(users)
            .set({ 
              voiceTime: sql`${users.voiceTime} + ${diffMins}`,
              voiceJoinedAt: null 
            })
            .where(and(eq(users.userId, userId), eq(users.guildId, guildId)));
        } else {
          await db.update(users).set({ voiceJoinedAt: null }).where(and(eq(users.userId, userId), eq(users.guildId, guildId)));
        }
      }
    } catch (e) {}
  }

  static async addRewards(userId: string, guildId: string, xpAmount: number, coinAmount: number = 0, voiceMins: number = 0) {
    try {
      const [user] = await db.select().from(users).where(
        and(eq(users.userId, userId), eq(users.guildId, guildId))
      );

      if (user) {
        await db.update(users)
          .set({
            xp: sql`${users.xp} + ${xpAmount}`,
            balance: sql`${users.balance} + ${coinAmount}`,
            voiceTime: sql`${users.voiceTime} + ${voiceMins}`,
            lastMessageAt: new Date(),
          })
          .where(and(eq(users.userId, userId), eq(users.guildId, guildId)));
      } else {
        await db.insert(users).values({
          userId,
          guildId,
          xp: xpAmount,
          balance: coinAmount,
          voiceTime: voiceMins,
        });
      }
    } catch (error) {
      console.error('[ECONOMY] Error adding rewards:', error);
    }
  }

  static async addRewardsToAll(guildId: string, xpAmount: number, coinAmount: number = 0) {
    try {
      await db.update(users)
        .set({
          xp: sql`${users.xp} + ${xpAmount}`,
          balance: sql`${users.balance} + ${coinAmount}`,
        })
        .where(eq(users.guildId, guildId));
    } catch (error) {
      console.error('[ECONOMY] Error adding rewards to all:', error);
    }
  }

  static async handleChatXP(userId: string, guildId: string) {
    try {
      const [user] = await db.select().from(users).where(
        and(eq(users.userId, userId), eq(users.guildId, guildId))
      );

      const xpAmount = BOT_CONFIG.economy.chatXp;
      const cooldownMs = BOT_CONFIG.economy.chatCooldownMinutes * 60 * 1000;

      if (user) {
        // Cek cooldown
        if (user.lastMessageAt) {
          const timeSinceLastMessage = Date.now() - user.lastMessageAt.getTime();
          if (timeSinceLastMessage < cooldownMs) {
            return; // Masih cooldown, tidak dapat XP
          }
        }

        await db.update(users)
          .set({
            xp: sql`${users.xp} + ${xpAmount}`,
            lastMessageAt: new Date(),
          })
          .where(and(eq(users.userId, userId), eq(users.guildId, guildId)));
      } else {
        await db.insert(users).values({
          userId,
          guildId,
          xp: xpAmount,
          lastMessageAt: new Date(),
        });
      }
    } catch (error) {
      console.error('[ECONOMY] Error handling chat XP:', error);
    }
  }

  static formatRupiah(amount: number): string {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  }
}
