const fs = require('fs');
if (fs.existsSync('config.env')) require('dotenv').config({ path: './config.env' });

function convertToBool(text, fault = 'true') {
    return text === fault ? true : false;
}

module.exports = {
    // 🔑 Main Config
    SESSION_ID: process.env.SESSION_ID || "",  // Yeh aapke Koyeb pairing link se milega
    PREFIX: process.env.PREFIX || ".",
    BOT_NAME: process.env.BOT_NAME || "QADEER-MD",
    OWNER_NAME: process.env.OWNER_NAME || "Qadeer Brahvi",
    OWNER_NUMBER: process.env.OWNER_NUMBER || "923300005253",
    DESCRIPTION: process.env.DESCRIPTION || "*© Powered By Qadeer-MD ⚡*",

    // 🖼️ Media & Display
    MENU_IMAGE_URL: process.env.MENU_IMAGE_URL || "https://files.catbox.moe/sidq95.jpg",
    ALIVE_IMG: process.env.ALIVE_IMG || "https://files.catbox.moe/sidq95.jpg",
    LIVE_MSG: process.env.LIVE_MSG || "> Zinda Hun Yar *QADEER-MD* ⚡",
    STICKER_NAME: process.env.STICKER_NAME || "QADEER-MD",

    // 👑 Owner & Developer
    DEV: process.env.DEV || "923300005253",

    // ⚙️ Features Control
    AUTO_STATUS_SEEN: convertToBool(process.env.AUTO_STATUS_SEEN, "true"),
    AUTO_STATUS_REPLY: convertToBool(process.env.AUTO_STATUS_REPLY, "false"),
    AUTO_STATUS_REACT: convertToBool(process.env.AUTO_STATUS_REACT, "true"),
    AUTO_STATUS_MSG: process.env.AUTO_STATUS_MSG || "*SᴇᴇN Yᴏᴜʀ Sᴛᴀᴛᴜs JᴜsT NᴏW Qᴀᴅᴇᴇʀ-Mᴅ ⚡*",

    WELCOME: convertToBool(process.env.WELCOME, "false"),
    ADMIN_EVENTS: convertToBool(process.env.ADMIN_EVENTS, "false"),

    CUSTOM_REACT: convertToBool(process.env.CUSTOM_REACT, "false"),
    CUSTOM_REACT_EMOJIS: process.env.CUSTOM_REACT_EMOJIS || "💝,💖,💗,❤️‍🩹,❤️,💚,💙,💜",

    DELETE_LINKS: convertToBool(process.env.DELETE_LINKS, "false"),
    ANTI_LINK: convertToBool(process.env.ANTI_LINK, "true"),
    ANTI_BAD: convertToBool(process.env.ANTI_BAD, "false"),
    ANTI_VV: convertToBool(process.env.ANTI_VV, "false"),
    ANTI_CALL: convertToBool(process.env.ANTI_CALL, "false"),
    REJECT_MSG: process.env.REJECT_MSG || "*_SORRY MY BOSS IS BUSY PLEASE DON'T CALL ME_*",
    ANTI_DELETE: convertToBool(process.env.ANTI_DELETE, "false"),
    ANTI_DEL_PATH: process.env.ANTI_DEL_PATH || "inbox",

    READ_MESSAGE: convertToBool(process.env.READ_MESSAGE, "false"),
    READ_CMD: convertToBool(process.env.READ_CMD, "false"),
    AUTO_REACT: convertToBool(process.env.AUTO_REACT, "false"),

    MODE: process.env.MODE || "public",
    PUBLIC_MODE: convertToBool(process.env.PUBLIC_MODE, "true"),
    ALWAYS_ONLINE: convertToBool(process.env.ALWAYS_ONLINE, "false"),
    AUTO_TYPING: convertToBool(process.env.AUTO_TYPING, "false"),
    AUTO_RECORDING: convertToBool(process.env.AUTO_RECORDING, "false"),

    AUTO_VOICE: convertToBool(process.env.AUTO_VOICE, "false"),
    AUTO_STICKER: convertToBool(process.env.AUTO_STICKER, "false"),
    AUTO_REPLY: convertToBool(process.env.AUTO_REPLY, "false"),
};
