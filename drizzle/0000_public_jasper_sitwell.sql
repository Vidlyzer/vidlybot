CREATE TABLE `config` (
	`id` int AUTO_INCREMENT NOT NULL,
	`guild_id` varchar(255) NOT NULL,
	`log_channel_id` varchar(255),
	`admin_role_id` varchar(255),
	`temp_voice_category_id` varchar(255),
	`create_voice_channel_id` varchar(255),
	CONSTRAINT `config_id` PRIMARY KEY(`id`),
	CONSTRAINT `config_guild_id_unique` UNIQUE(`guild_id`)
);
--> statement-breakpoint
CREATE TABLE `voice_rooms` (
	`id` int AUTO_INCREMENT NOT NULL,
	`guild_id` varchar(255) NOT NULL,
	`channel_id` varchar(255) NOT NULL,
	`owner_id` varchar(255) NOT NULL,
	`log_message_id` varchar(255),
	`log_content` varchar(5000),
	`history` json,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `voice_rooms_id` PRIMARY KEY(`id`),
	CONSTRAINT `voice_rooms_channel_id_unique` UNIQUE(`channel_id`)
);
--> statement-breakpoint
CREATE TABLE `warns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` varchar(255) NOT NULL,
	`guild_id` varchar(255) NOT NULL,
	`reason` varchar(1000) NOT NULL,
	`moderator_id` varchar(255) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`expires_at` timestamp NOT NULL,
	CONSTRAINT `warns_id` PRIMARY KEY(`id`)
);
