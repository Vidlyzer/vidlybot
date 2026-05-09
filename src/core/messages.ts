export const SYSTEM_MESSAGES = {
  // 🎙️ Log di Channel Suara (Pesan yang muncul di chat voice room)
  voice: {
    periodicReward: "[+] @here Mendapatkan {xp} XP & {saldo} Saldo.",
    roomCreated: "[+] Room berhasil dibuat.",
    ownershipTransfer:
      "👑 Anda sekarang adalah pemilik baru dari room **{name}**!",
  },

  // 🛡️ Auto-Moderasi
  autoMod: {
    messageDeleted: "{symbol} Pesan dihapus: Auto-mod.",
    warningTitle: "🛡️ Auto-Moderasi",
  },

  // 📝 Log Formal (Pesan yang dikirim ke channel log khusus)
  logs: {
    voiceCreateTitle: "Voice Room Created",
    voiceCreateBody:
      "**Pemilik : ** {member}\n**Channel : ** {name}\n**Bitrate : ** `{bitrate} kbps`   |   **Batas : ** {limit}\n**Waktu : ** `{time}`",
    voiceHistoryHeader: "Logs :",
    xpRewardTitle: "REWARD MENITAN",
  },
};
