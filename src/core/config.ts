import { ActivityType } from "discord.js";

export const BOT_CONFIG = {
  // 🆔 Identitas & Akses
  clientId: "1239365843738169424",
  guildId: "739365630251237446", // ID server tempat perintah dobel muncul
  adminRoleId: "1486586315901501440", // Hardcoded Admin Role ID

  // 🎭 Persona Bot & Gaya Komunikasi (Minimalist Style)
  persona: {
    status: {
      text: "Vidlyzer Community",
      type: ActivityType.Watching,
      state: "online",
    },
    logPrefix: {
      info: "[*]",
      warn: "[!]",
      error: "[-]",
      success: "[+]",
    },
    // Simbol Minimalis (Pengganti Emoji)
    symbols: {
      success: "[+]",
      warn: "[!]",
      error: "[x]",
      info: "[*]",
      voice: "[#]",
      admin: "[🛡]",
    },
  },

  // 🎙️ Temporary Voice Settings
  tempVoice: {
    prefix: "", // Menghapus prefix dekoratif agar minimalis
    emptyTimeout: 15000,
    cooldown: 3000,
    logChannelId: "955158898954874971",
    accessRoleId: "1485882389430272010",
    createVoiceChannelId: "1474398609712877803",
    tempVoiceCategoryId: "1474398415113683105",
    bannerUrl:
      "https://cdn.discordapp.com/attachments/1237802179595735071/1485513115570405376/Temp_Voice1.png?ex=69c22366&is=69c0d1e6&hm=541311319afd7f71557e0ac0d68c9417ed8783ee1f2fe0b676225f43f503856d&",
  },

  // 🛡️ Auto-Moderasi
  autoMod: {
    enabled: true,
    filterLinks: true,
    filterBadWords: true,
    badWords: ["anjing", "babi", "tolol", "goblok", "bangsat"],
    warnDecayDays: 30,
    deleteWarningAfter: 5000,
  },

  // 💰 Economy Settings
  economy: {
    chatXp: 5,
    chatCooldownMinutes: 30, // Cooldown untuk mendapatkan XP dari chat
    voiceRewardMinutes: 30, // Interval reward ketika berada di voice channel
  },

  // 🔗 Tautan Eksternal
  links: {
    panel: "https://panel.nura.host",
    invite: "https://discord.gg/vidlyzer",
    website: "https://vidlyzer.com",
  },

  // 🎨 Colors
  colors: {
    primary: 0x2f3136, // Menggunakan warna gelap yang lebih minimalis
    success: 0x43b581,
    warn: 0xfaa61a,
    error: 0xf04747,
    formal: 0x2f3136,
  },
};
