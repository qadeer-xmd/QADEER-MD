const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  jidNormalizedUser,
  getContentType,
  proto,
  generateForwardMessageContent,
  generateWAMessageFromContent,
  downloadContentFromMessage,
  jidDecode,
  fetchLatestBaileysVersion,
  Browsers
} = require('@whiskeysockets/baileys')

const fs = require('fs')
const path = require('path')
const os = require('os')
const util = require('util')
const P = require('pino')
const axios = require('axios')
const FileType = require('file-type')
const { getBuffer } = require('./lib/functions')
const { AntiDelete } = require('./lib')
const GroupEvents = require('./lib/groupevents')
const config = require('./config')

// ⚡ Settings (QADEER-MD)
const prefix = "."
const ownerNumber = ["923300005253"]
const botName = "QADEER-MD"
const ownerName = "QADEER BRAHVI"
const menuPic = "https://files.catbox.moe/sidq95.jpg"
const channelLink = "https://whatsapp.com/channel/0029VbAkAEhCRs1g8MmyEJ2K"

// 🗂️ Temp folder
const tempDir = path.join(os.tmpdir(), 'cache-temp')
if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir)
setInterval(() => {
  fs.readdir(tempDir, (err, files) => {
    if (err) return
    for (const file of files) {
      fs.unlink(path.join(tempDir, file), () => { })
    }
  })
}, 5 * 60 * 1000)

// 🚀 Connect to WhatsApp
async function connectToWA() {
  console.log(`🔄 Connecting to ${botName}...`)
  const { state, saveCreds } = await useMultiFileAuthState(__dirname + '/sessions/')
  const { version } = await fetchLatestBaileysVersion()

  const conn = makeWASocket({
    logger: P({ level: 'silent' }),
    printQRInTerminal: true,
    browser: Browsers.macOS("Safari"),
    auth: state,
    version
  })

  // 📡 Connection update
  conn.ev.on("connection.update", update => {
    const { connection, lastDisconnect } = update
    if (connection === "close") {
      if (lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut) {
        connectToWA()
      }
    } else if (connection === "open") {
      console.log(`✅ ${botName} Connected!`)
      console.log(`👑 Owner: ${ownerName} (${ownerNumber})`)

      let upMsg = `*Hello ${botName} User! 👋*\n\n` +
        `> Simple , Straight Forward But Loaded With Features 🎉\n\n` +
        `*Thanks for using ${botName} 💚*\n\n` +
        `> Join WhatsApp Channel :- ⤵️\n${channelLink}\n\n` +
        `*Prefix:* ${prefix}\n\n` +
        `© Powered by ${botName} | Owner: ${ownerName}`

      conn.sendMessage(conn.user.id, {
        image: { url: menuPic },
        caption: upMsg
      })
    }
  })

  // 🔑 Save session
  conn.ev.on("creds.update", saveCreds)

  // 🗑 Anti Delete
  conn.ev.on("messages.update", async updates => {
    for (const update of updates) {
      if (update.update.message === null) {
        await AntiDelete(conn, updates)
      }
    }
  })

  // 👥 Group Events
  conn.ev.on("group-participants.update", (update) => GroupEvents(conn, update))

  // 📩 Message Handler
  conn.ev.on("messages.upsert", async (mek) => {
    mek = mek.messages[0]
    if (!mek.message) return
    const type = getContentType(mek.message)
    const from = mek.key.remoteJid
    const body = (type === "conversation")
      ? mek.message.conversation
      : (type === "extendedTextMessage")
        ? mek.message.extendedTextMessage.text
        : (mek.message.imageMessage?.caption || mek.message.videoMessage?.caption) || ""

    const isCmd = body.startsWith(prefix)
    const command = isCmd ? body.slice(prefix.length).trim().split(" ")[0].toLowerCase() : ""
    const args = body.trim().split(/ +/).slice(1)
    const q = args.join(" ")

    // 📌 Menu Command
    if (command === "menu") {
      const menuText = `╔══❖◆❖══╗
  🤖 *${botName} Menu*
╚══❖◆❖══╝

👑 Owner: ${ownerName}
📞 Owner No: ${ownerNumber}
📌 Prefix: ${prefix}

📢 Channel:
${channelLink}

⚡ Commands:
.hello - Test bot
.menu - Show this menu

© Powered by ${botName}
      `
      await conn.sendMessage(from, { image: { url: menuPic }, caption: menuText }, { quoted: mek })
    }

    if (command === "hello") {
      await conn.sendMessage(from, { text: `Hello 👋, I am ${botName} by ${ownerName}` }, { quoted: mek })
    }
  })
}

connectToWA()
