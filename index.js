/*
╔══════════════════════════════════╗
║      🤖 QADEER-MD WHATSAPP BOT    ║
║  Powered by: Qadeer Brahvi 👑     ║
║  Owner: +923300005253             ║
╚══════════════════════════════════╝
*/

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
const P = require('pino')
const path = require('path')
const os = require('os')
const util = require('util')
const axios = require('axios')
const FileType = require('file-type')
const config = require('./config')
const { sms } = require('./lib')

// ========== SETTINGS ==========
const prefix = config.PREFIX || "."
const ownerNumber = [config.OWNER_NUMBER || "923300005253"]
const botName = config.BOT_NAME || "QADEER-MD"
const ownerName = config.OWNER_NAME || "Qadeer Brahvi"
const menuImage = config.MENU_IMAGE_URL || "https://files.catbox.moe/sidq95.jpg"
const channelLink = "https://whatsapp.com/channel/0029VbAkAEhCRs1g8MmyEJ2K"

// ========== CLEAR TEMP ==========
const tempDir = path.join(os.tmpdir(), 'cache-temp')
if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir)
setInterval(() => {
  fs.readdir(tempDir, (err, files) => {
    if (err) return
    for (const file of files) {
      fs.unlink(path.join(tempDir, file), () => {})
    }
  })
}, 5 * 60 * 1000)

// ========== CONNECT ==========
async function connectToWA() {
  console.log(`⚡ Connecting ${botName} to WhatsApp...`)
  const { state, saveCreds } = await useMultiFileAuthState(__dirname + '/sessions/')
  var { version } = await fetchLatestBaileysVersion()

  const conn = makeWASocket({
    logger: P({ level: 'silent' }),
    printQRInTerminal: true,
    browser: Browsers.macOS("Firefox"),
    syncFullHistory: true,
    auth: state,
    version
  })

  conn.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect } = update
    if (connection === 'close') {
      if (lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut) {
        connectToWA()
      }
    } else if (connection === 'open') {
      console.log(`✅ ${botName} Connected!`)
      let up = `*Hello! ${botName} is online now* ⚡\n\n`
      up += `> Owner: ${ownerName}\n`
      up += `> Prefix: ${prefix}\n`
      up += `> Join our WhatsApp Channel:\n${channelLink}\n\n`
      up += `*Thanks for using ${botName} 💖*`
      conn.sendMessage(conn.user.id, { image: { url: menuImage }, caption: up })
    }
  })

  conn.ev.on('creds.update', saveCreds)

  // ========== MESSAGE HANDLER ==========
  conn.ev.on('messages.upsert', async (m) => {
    const mek = m.messages[0]
    if (!mek.message) return
    const from = mek.key.remoteJid
    const type = getContentType(mek.message)
    const body = (type === 'conversation') ? mek.message.conversation : 
                 (type === 'extendedTextMessage') ? mek.message.extendedTextMessage.text : 
                 (mek.message[type]?.caption || "")
    const isCmd = body.startsWith(prefix)
    const command = isCmd ? body.slice(prefix.length).trim().split(' ')[0].toLowerCase() : ""
    const args = body.trim().split(/ +/).slice(1)
    const text = args.join(" ")
    const sender = mek.key.fromMe ? conn.user.id : mek.key.participant || mek.key.remoteJid
    const senderNumber = sender.split('@')[0]
    const pushname = mek.pushName || "User"
    const reply = (msg) => conn.sendMessage(from, { text: msg }, { quoted: mek })

    // ========== COMMANDS ==========
    if (isCmd) {
      switch (command) {

        case 'ping':
          const start = new Date().getTime()
          reply("🏓 Pinging...")
          const end = new Date().getTime()
          reply(`⚡ Pong! Speed: *${end - start}ms*`)
          break

        case 'alive':
          conn.sendMessage(from, {
            image: { url: menuImage },
            caption: `> I'm Alive Boss 😎\n\n*Bot:* ${botName}\n*Owner:* ${ownerName}\n*Prefix:* ${prefix}\n\nPowered by ${botName} ⚡`
          }, { quoted: mek })
          break

        case 'menu':
          let menu = `╔═══『 ${botName} 』═══╗\n`
          menu += `👑 Owner: ${ownerName}\n`
          menu += `📞 Number: ${ownerNumber[0]}\n`
          menu += `⚡ Prefix: ${prefix}\n`
          menu += `📡 Channel: ${channelLink}\n`
          menu += `╚════════════════╝\n\n`
          menu += `✨ Available Commands ✨\n`
          menu += `- ${prefix}ping\n`
          menu += `- ${prefix}alive\n`
          menu += `- ${prefix}menu\n\n`
          menu += `*Thanks for using ${botName} 💖*`
          conn.sendMessage(from, { image: { url: menuImage }, caption: menu }, { quoted: mek })
          break

        default:
          if (isCmd) reply(`❌ Unknown command: *${command}*`)
      }
    }
  })
}

connectToWA()
