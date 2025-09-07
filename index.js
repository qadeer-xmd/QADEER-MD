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
  jidNormalizedUser,
  getContentType,
  downloadContentFromMessage,
  generateForwardMessageContent,
  generateWAMessageFromContent,
  fetchLatestBaileysVersion,
  Browsers
} = require("@whiskeysockets/baileys");

const pino = require("pino");
const fs = require("fs");
const path = require("path");
const express = require("express");
const chalk = require("chalk");
const P = require("pino");
const Config = require("./config"); // آپکا config.js (جو آپ نے دیا تھا)
const util = require("util");
const axios = require("axios");

// Basic settings (آپ چاہیں تو config سے بھی لے سکتے ہیں)
const prefix = Config.PREFIX || ".";
const PORT = process.env.PORT || 3000;
const botName = Config.BOT_NAME || "QADEER-MD";
const ownerName = Config.OWNER_NAME || "Qadeer Brahvi";
const ownerNumber = Config.OWNER_NUMBER || "923300005253";
const channelLink = Config.CHANNEL_LINK || ""; // اگر channel link چاہیے تو config میں ڈالیں
const menuImage = Config.MENU_IMAGE_URL || "https://files.catbox.moe/sidq95.jpg";

// helper: load plugins/commands directory (simple convention)
function loadCommands(dir = path.join(__dirname, "commands")) {
  const commands = {};
  if (!fs.existsSync(dir)) return commands;
  for (const file of fs.readdirSync(dir)) {
    if (!file.endsWith(".js")) continue;
    try {
      const cmd = require(path.join(dir, file));
      if (cmd && (cmd.name || cmd.pattern)) {
        const key = cmd.name || cmd.pattern;
        commands[key.toString().toLowerCase()] = cmd;
      }
    } catch (e) {
      console.error("Error loading command", file, e);
    }
  }
  return commands;
}

// small util to get buffer from url
async function getBuffer(url) {
  const res = await axios.get(url, { responseType: "arraybuffer", timeout: 20000 });
  return Buffer.from(res.data);
}

async function startBot() {
  console.log(chalk.yellowBright("🔌 Starting QADEER-MD..."));

  // create sessions folder if not exists
  const sessionsDir = path.join(__dirname, "sessions");
  if (!fs.existsSync(sessionsDir)) fs.mkdirSync(sessionsDir, { recursive: true });

  // auth state
  const { state, saveCreds } = await useMultiFileAuthState(sessionsDir);

  // get latest baileys version
  const { version } = await fetchLatestBaileysVersion();

  const conn = makeWASocket({
    logger: pino({ level: "silent" }),
    printQRInTerminal: true, // true for local use; set false on hosted pair+session flow
    auth: state,
    version,
    browser: Browsers.macOS(botName || "QADEER-MD")
  });

  // save credentials whenever updated
  conn.ev.on("creds.update", saveCreds);

  // load commands
  const commands = loadCommands(path.join(__dirname, "commands"));
  console.log(chalk.green(`📂 Loaded ${Object.keys(commands).length} plugin(s)`));

  // connection updates
  conn.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect } = update;
    console.log("Connection Update:", connection);
    if (connection === "close") {
      const shouldReconnect =
        !(lastDisconnect || {}).error ||
        (lastDisconnect.error.output?.statusCode !== DisconnectReason.loggedOut);
      console.log(chalk.red("⚠️ Connection closed."), "Reconnect:", shouldReconnect);
      if (shouldReconnect) {
        setTimeout(() => startBot(), 2000);
      } else {
        console.log(chalk.red("Logged out — please re-pair or update SESSION.")); 
      }
    } else if (connection === "open") {
      console.log(chalk.greenBright(`✅ ${botName} Connected!`));
      console.log(chalk.blue(`👑 Owner: ${ownerName} (${ownerNumber})`));
      if (channelLink) console.log(chalk.yellow(`📢 Channel: ${channelLink}`));
      // send simple alive message to bot account (optional)
      try {
        const up = `👋 *${botName}* Online!\nOwner: ${ownerName}\nPrefix: ${prefix}`;
        conn.sendMessage(conn.user.id, { image: { url: menuImage }, caption: up }).catch(() => {});
      } catch (e) {}
    }
  });

  // messages handler
  conn.ev.on("messages.upsert", async (m) => {
    try {
      const up = m.messages[0];
      if (!up) return;
      if (!up.message) return;
      if (up.key && up.key.fromMe) return; // ignore own messages

      // normalize ephemeral / viewOnce
      let message = up.message;
      if (getContentType(message) === "ephemeralMessage") {
        message = message.ephemeralMessage.message;
      }

      const type = getContentType(message);
      const from = up.key.remoteJid;
      const isGroup = from.endsWith("@g.us");
      const sender = up.key.participant || up.key.remoteJid;
      const pushname = up.pushName || "Unknown";

      // extract text body (conversation or extendedTextMessage or caption)
      let body = "";
      if (type === "conversation") body = message.conversation || "";
      else if (type === "extendedTextMessage") body = message.extendedTextMessage?.text || "";
      else if (type === "imageMessage") body = message.imageMessage?.caption || "";
      else if (type === "videoMessage") body = message.videoMessage?.caption || "";

      if (!body) return;

      const isCmd = body.startsWith(prefix);
      const args = body.trim().split(/ +/).slice(1);
      const command = isCmd ? body.slice(prefix.length).trim().split(/ +/)[0].toLowerCase() : "";

      // quick owner eval (dangerous; only for dev use) — optional, controlled via DEV in config
      const senderNumber = sender.split("@")[0];
      const isOwner = (Config.DEV && Config.DEV.toString().includes(senderNumber)) || (Config.OWNER_NUMBER && Config.OWNER_NUMBER.includes(senderNumber));

      // OWNER only eval helpers (% and $)
      if (isOwner && body.startsWith("%")) {
        const code = body.slice(1).trim();
        try {
          const res = eval(code);
          await conn.sendMessage(from, { text: util.format(res) }, { quoted: up }).catch(() => {});
        } catch (err) {
          await conn.sendMessage(from, { text: "Eval Error: " + util.format(err) }, { quoted: up }).catch(() => {});
        }
        return;
      }
      if (isOwner && body.startsWith("$")) {
        const code = body.slice(1).trim();
        try {
          const res = await (async () => eval(`(async()=>{ ${code} })()`))();
          await conn.sendMessage(from, { text: util.format(res) }, { quoted: up }).catch(() => {});
        } catch (err) {
          await conn.sendMessage(from, { text: "Async Eval Error: " + util.format(err) }, { quoted: up }).catch(() => {});
        }
        return;
      }

      // default commands: ping, menu, help, alive
      if (isCmd) {
        if (command === "ping") {
          const started = Date.now();
          await conn.sendMessage(from, { text: "🏓 Pinging..." }, { quoted: up }).catch(() => {});
          const latency = Date.now() - started;
          await conn.sendMessage(from, { text: `✅ Pong! ${latency}ms` }, { quoted: up }).catch(() => {});
          return;
        }

        if (command === "menu" || command === "help") {
          const text = `✨ *${botName}* ✨\n\n👑 Owner: ${ownerName}\n📞 ${ownerNumber}\n\nUse *${prefix}ping* to test.\nUse *${prefix}menu* to see this.`;
          await conn.sendMessage(from, { image: { url: menuImage }, caption: text }, { quoted: up }).catch(() => {});
          return;
        }

        if (command === "alive") {
          await conn.sendMessage(from, { text: `✅ ${botName} is online!\nOwner: ${ownerName}` }, { quoted: up }).catch(() => {});
          return;
        }

        // plugin command handling (simple match by pattern/name)
        if (commands[command]) {
          try {
            // plugin should export `function(conn, msg, args, extra)` or `execute`
            const plugin = commands[command];
            if (typeof plugin === "function") {
              await plugin(conn, up, args);
            } else if (typeof plugin.execute === "function") {
              await plugin.execute(conn, up, args, { prefix, botName, ownerName, ownerNumber });
            } else if (typeof plugin.function === "function") {
              await plugin.function(conn, up, args, { prefix, botName, ownerName, ownerNumber });
            } else {
              // fallback
              await conn.sendMessage(from, { text: "Command found but plugin has no execute function." }, { quoted: up });
            }
          } catch (err) {
            console.error("Plugin error:", err);
            await conn.sendMessage(from, { text: "⚠️ Plugin error occurred." }, { quoted: up }).catch(() => {});
          }
          return;
        }
      }

      // non-command features (auto react/status/etc) - use config toggles
      // auto-status react example (when message comes from status@broadcast)
      if (up.key && up.key.remoteJid === "status@broadcast" && Config.AUTO_STATUS_REACT === "true") {
        try {
          const emojis = ["❤️", "🔥", "👍", "💯", "😎"];
          const pick = emojis[Math.floor(Math.random() * emojis.length)];
          const jid = await jidNormalizedUser(conn.user.id);
          await conn.sendMessage(up.key.remoteJid, { react: { text: pick, key: up.key } }, { statusJidList: [up.key.participant, jid] }).catch(() => {});
        } catch (e) {}
      }

    } catch (e) {
      console.error("messages.upsert error:", e);
    }
  });

  // convenience: sendFileUrl
  conn.sendFileUrl = async (jid, url, caption = "", quoted = {}, options = {}) => {
    try {
      const buff = await getBuffer(url);
      // basic mime check
      const isImage = /image/.test((options.mimetype || "").toString()) || /.(jpg|jpeg|png|webp)$/i.test(url);
      if (isImage) return await conn.sendMessage(jid, { image: buff, caption, ...options }, { quoted });
      // default video/audio/document detection could be improved
      return await conn.sendMessage(jid, { document: buff, fileName: "file", caption, ...options }, { quoted });
    } catch (e) {
      console.error("sendFileUrl error:", e);
      throw e;
    }
  };

  // export minimal utilities
  conn.getBuffer = getBuffer;

  // notify in console
  console.log(chalk.green(`🚀 ${botName} is up. Web server and listener active.`));
  return conn;
}

// express keep-alive / status page
const app = express();
app.get("/", (req, res) => {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(`
    <h2 style="font-family: sans-serif;">${botName} is running ⚡</h2>
    <p>Owner: <strong>${ownerName}</strong> (${ownerNumber})</p>
    <p><img src="${menuImage}" alt="menu" style="max-width:300px; border-radius:8px;"></p>
    <p>Prefix: <strong>${prefix}</strong></p>
    <p>Powered by <strong>${botName}</strong></p>
  `);
});

app.listen(PORT, () => console.log(chalk.cyan(`🌐 Web server started on port ${PORT}`)));

// start
startBot().catch((err) => {
  console.error("Start error:", err);
  process.exit(1);
});
