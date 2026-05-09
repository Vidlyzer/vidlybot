import { mysqlTable, int, varchar, timestamp, json, bigint } from 'drizzle-orm/mysql-core';

export const users = mysqlTable('users', {
  id: int('id').autoincrement().primaryKey(),
  userId: varchar('user_id', { length: 255 }).notNull(),
  guildId: varchar('guild_id', { length: 255 }).notNull(),
  xp: int('xp').default(0).notNull(),
  balance: bigint('balance', { mode: 'number' }).default(0).notNull(),
  voiceTime: bigint('voice_time', { mode: 'number' }).default(0).notNull(), // Dalam menit
  voiceJoinedAt: timestamp('voice_joined_at'),
  lastMessageAt: timestamp('last_message_at').defaultNow(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const voiceRooms = mysqlTable('voice_rooms', {
  id: int('id').autoincrement().primaryKey(),
  guildId: varchar('guild_id', { length: 255 }).notNull(),
  channelId: varchar('channel_id', { length: 255 }).notNull().unique(),
  ownerId: varchar('owner_id', { length: 255 }).notNull(),
  logMessageId: varchar('log_message_id', { length: 255 }),
  logContent: varchar('log_content', { length: 5000 }),
  history: json('history').$type<string[]>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const botStatus = mysqlTable('bot_status', {
  id: int('id').primaryKey().default(1),
  instanceName: varchar('instance_name', { length: 255 }).notNull(),
  lastHeartbeat: timestamp('last_heartbeat').defaultNow().onUpdateNow().notNull(),
});
