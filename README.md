# 🤖 Vidlyzer Bot

Bot Discord Moderasi dan Temporary Voice berbasis TypeScript dengan arsitektur **Clean Architecture**.

## 🚀 Fitur Utama

- **Moderasi:** Kick, Ban, Timeout, Warn (dengan sistem Warn Decay 30 hari).
- **Temporary Voice:** Sistem "Join-to-Create" dengan panel kontrol (Lock, Rename, Limit, Kick).
- **Auto-Moderasi:** Filter kata kasar dan link otomatis.
- **Utilitas:** Userinfo, Serverinfo, dan Help menu dinamis.

## 🛠️ Persiapan (Setup)

1. **Instalasi Dependensi:**
   ```bash
   npm install
   ```

2. **Konfigurasi Environment (`.env`):**
   Buat file `.env` dan isi data sensitif berikut:
   ```env
   DISCORD_TOKEN=your_bot_token
   DATABASE_URL=postgresql://user:pass@host:port/dbname
   ```

3. **Konfigurasi Global (`src/core/config.ts`):**
   Edit file ini untuk mengatur:
   - `clientId`: Application ID bot Anda.
   - `ownerId`: ID Discord Anda (untuk akses God Mode).
   - Status Bot, Emoji, dan Link bantuan.

4. **Migrasi Database:**
   > ⚠️ **PENTING:** Selalu jalankan perintah ini dari **mesin lokal (laptop/PC)** Anda. Jangan memasukkannya ke dalam `postinstall` atau menjalankannya di Pterodactyl jika Anda tidak memiliki akses terminal interaktif, karena perintah ini membutuhkan konfirmasi manual (y/n).
   ```bash
   npm run db:push
   ```

5. **Deploy Slash Commands:**
   ```bash
   npm run deploy
   ```

## 🏗️ Struktur Folder

- `src/core/`: Konfigurasi terpusat dan konstanta.
- `src/application/services/`: Logika bisnis (Warn cleanup, dll).
- `src/infrastructure/`: Database, Logger, dan Discord helpers.
- `src/presentation/`: Slash commands dan event listeners.
- `src/shared/utils/`: Fungsi pembantu umum.

## 🚢 Deployment (Pterodactyl)

1. Jalankan `npm run build` untuk kompilasi ke JavaScript.
2. Push kode ke branch `main` di GitHub.
3. **PENTING:** Login ke panel Pterodactyl dan lakukan **Git Pull** secara manual.
4. Bot akan otomatis restart (jika auto-restart aktif) atau nyalakan secara manual.

---
*Dibuat dengan ❤️ untuk Vidlyzer Community.*
