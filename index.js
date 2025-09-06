/**
 * QADEER-MD WhatsApp Bot
 * Based on Baileys MD
 * Owner: QADEER-BRAHVI
 * Number: 923300005253
 * Channel: https://whatsapp.com/channel/0029VbAkAEhCRs1g8MmyEJ2K
 */

const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion
} = require("@whiskeysockets/baileys");
const pino = require("pino");
const fs = require("fs");
const path = require("path");
const express = require("express");

// ⚡ Prefix (dot)
const prefix = ".";
const PORT = process.env.PORT || 3000;

// 🧑‍💻 Owner Info
const ownerName = "QADEER-BRAHVI";
const ownerNumber = "923300005253";
const channelLink = "https://whatsapp.com/channel/0029VbAkAEhCRs1g8MmyEJ2K";

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("auth_info");
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    logger: pino({ level: "silent" }),
    printQRInTerminal: true,
    auth: state,
    browser: ["QADEER-MD", "Chrome", "5.0.0"]
  });

  // 🔌 Connection updates
  sock.ev.on("connection.update", update => {
    const { connection, lastDisconnect } = update;
    if (connection === "close") {
      const shouldReconnect =
        lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      console.log("⚠️ Connection closed. Reconnecting:", shouldReconnect);
      if (shouldReconnect) startBot();
    } else if (connection === "open") {
      console.log("✅ QADEER-MD connected successfully!");
      console.log(`👑 Owner: ${ownerName} (${ownerNumber})`);
      console.log(`📢 Official Channel: ${channelLink}`);
    }
  });

  sock.ev.on("creds.update", saveCreds);

  // 📂 Load commands from /commands
  const commands = {};
  const cmdPath = path.join(__dirname, "commands");
  if (fs.existsSync(cmdPath)) {
    fs.readdirSync(cmdPath).forEach(file => {
      if (file.endsWith(".js")) {
        const cmd = require(path.join(cmdPath, file));
        commands[cmd.name] = cmd;
      }
    });
  }

  // 📩 Message handler
  sock.ev.on("messages.upsert", async m => {
    const msg = m.messages[0];
    if (!msg.message || msg.key.fromMe) return;

    const from = msg.key.remoteJid;
    const type = Object.keys(msg.message)[0];
    const text =
      type === "conversation"
        ? msg.message.conversation
        : msg.message.extendedTextMessage?.text;

    if (!text || !text.startsWith(prefix)) return;

    const args = text.slice(prefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();

    if (commands[commandName]) {
      try {
        await commands[commandName].execute(sock, msg, args, { ownerName, ownerNumber, prefix, channelLink });
      } catch (e) {
        console.error("❌ Command error:", e);
        await sock.sendMessage(from, { text: "⚠️ Error while running command." });
      }
    }
  });
}

// 🌍 Express server (for hosting/keep-alive)
const app = express();
app.get("/", (_, res) =>
  res.send(
    `✅ QADEER-MD Bot is running!<br>👑 Owner: ${ownerName} (${ownerNumber})<br>📢 Channel: <a href="${channelLink}">${channelLink}</a>`
  )
);
app.listen(PORT, () => console.log(`🌐 Web server started on port ${PORT}`));

// 🚀 Start the bot
startBot();
