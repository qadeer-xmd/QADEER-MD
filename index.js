/**
 * ╔═╗╔═╗╔╗ ╔═╗╔═╗╔═╗╦═╗   Made with 💚
 * ╚═╗║╣ ╠╩╗║╣ ║ ╦║╣ ╠╦╝   Bot: QADEER-MD
 * ╚═╝╚═╝╚═╝╚═╝╚═╝╚═╝╩╚═   Owner: Qadeer Brahvi
 * 
 * 👑 Owner Number: 923300005253
 * ⚡ Powered by QADEER-MD
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
const chalk = require("chalk");

// ⚡ Settings
const prefix = ".";
const PORT = process.env.PORT || 3000;
const botName = "QADEER-MD";
const ownerName = "Qadeer Brahvi";
const ownerNumber = "923300005253";
const channelLink = "https://whatsapp.com/channel/0029VbAkAEhCRs1g8MmyEJ2K";
const menuImage = "https://files.catbox.moe/sidq95.jpg"; // custom image

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("auth_info");
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    logger: pino({ level: "silent" }),
    printQRInTerminal: true,
    auth: state,
    browser: [botName, "Chrome", "5.0.0"]
  });

  // 🔌 Connection updates
  sock.ev.on("connection.update", update => {
    const { connection, lastDisconnect } = update;
    if (connection === "close") {
      const shouldReconnect =
        lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      console.log(chalk.red.bold("⚠️ Connection closed."), "Reconnecting:", shouldReconnect);
      if (shouldReconnect) startBot();
    } else if (connection === "open") {
      console.log(chalk.green.bold(`✅ ${botName} Connected!`));
      console.log(chalk.blue(`👑 Owner: ${ownerName} (${ownerNumber})`));
      console.log(chalk.yellow(`📢 Join our channel: ${channelLink}`));
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

    // Simple Ping command
    if (commandName === "ping") {
      const start = new Date();
      await sock.sendMessage(from, { text: "🏓 Pinging..." });
      const end = new Date() - start;
      return await sock.sendMessage(from, { text: `✅ Pong! ${end}ms` });
    }

    // Menu command
    if (commandName === "menu") {
      return await sock.sendMessage(from, {
        image: { url: menuImage },
        caption: `✨ *${botName}* ✨\n\n👑 Owner: ${ownerName}\n📞 ${ownerNumber}\n\n⚡ Powered by ${botName}`
      });
    }

    // Other commands
    if (commands[commandName]) {
      try {
        await commands[commandName].execute(sock, msg, args, { ownerName, ownerNumber, prefix });
      } catch (e) {
        console.error(chalk.red("❌ Command error:"), e);
        await sock.sendMessage(from, { text: "⚠️ Error while running command." });
      }
    }
  });
}

// 🌍 Express server (for hosting/keep-alive)
const app = express();
app.get("/", (_, res) =>
  res.send(
    `✅ ${botName} is running! <br> 👑 Owner: ${ownerName} (${ownerNumber}) <br> 📢 <a href="${channelLink}">Join Channel</a> <br> ⚡ Powered by ${botName}`
  )
);
app.listen(PORT, () => console.log(chalk.cyan(`🌐 Web server started on port ${PORT}`)));

// 🚀 Start the bot
startBot();
