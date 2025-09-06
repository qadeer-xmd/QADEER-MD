const fs = require('fs');
if (fs.existsSync('config.env')) require('dotenv').config({ path: './config.env' });

function convertToBool(text, fault = 'true') {
    return text === fault ? true : false;
}
module.exports = {
SESSION_ID: process.env.SESSION_ID || "",
// apna Session Id idhar daalo 

AUTO_STATUS_SEEN: process.env.AUTO_STATUS_SEEN || "true",
// true/false : status auto seen karwana ho ya nahi 

AUTO_STATUS_REPLY: process.env.AUTO_STATUS_REPLY || "false",
// true/false : status reply auto karwana ho ya nahi 

AUTO_STATUS_REACT: process.env.AUTO_STATUS_REACT || "true",
// true/false : status par emoji react karwana ho ya nahi 

AUTO_STATUS_MSG: process.env.AUTO_STATUS_MSG || "*تمہارا status دیکھ لیا ابھی 😎 - QADEER-MD*",
// auto reply msg on status 

WELCOME: process.env.WELCOME || "false",
// true/false : groups mein welcome aur goodbye msg 

ADMIN_EVENTS: process.env.ADMIN_EVENTS || "false",
// true/false : admin promote/demote ka notification 

PREFIX: process.env.PREFIX || ".",
// apna prefix (default ".") 

MENU_IMAGE_URL: process.env.MENU_IMAGE_URL || "https://files.catbox.moe/sidq95.jpg",
// custom menu image (abhi QADEER-MD wali lagayi hai)  

BOT_NAME: process.env.BOT_NAME || "QADEER-MD",
// bot ka naam 

STICKER_NAME: process.env.STICKER_NAME || "QADEER-MD",
// sticker pack name  

CUSTOM_REACT: process.env.CUSTOM_REACT || "false",
// true/false custom react 

CUSTOM_REACT_EMOJIS: process.env.CUSTOM_REACT_EMOJIS || "💝,💖,💗,❤️,💚,💙,💜,🖤",
// apne emojis select kar lo 

DELETE_LINKS: process.env.DELETE_LINKS || "false",
// true/false : links delete automatic 

OWNER_NUMBER: process.env.OWNER_NUMBER || "923300005253",
// yahan apna real number (country code ke sath) 

OWNER_NAME: process.env.OWNER_NAME || "QADEER-BRAHVI",
// apna owner name 

DESCRIPTION: process.env.DESCRIPTION || "*© Powered by QADEER-MD*",
// description / powered by 

ALIVE_IMG: process.env.ALIVE_IMG || "https://files.catbox.moe/sidq95.jpg",
// alive command ke liye image  

LIVE_MSG: process.env.LIVE_MSG || "✅ Main zinda hoon - *QADEER-MD*⚡",
// alive msg  

READ_MESSAGE: process.env.READ_MESSAGE || "false",
// true/false : auto read msgs  

AUTO_REACT: process.env.AUTO_REACT || "false",
// true/false : auto react on all msgs  

ANTI_BAD: process.env.ANTI_BAD || "false",
// true/false : bad words filter  

MODE: process.env.MODE || "public",
// public/private/group  

ANTI_LINK: process.env.ANTI_LINK || "true",
// true/false : anti link in groups  

AUTO_VOICE: process.env.AUTO_VOICE || "false",
// true/false : auto voice msg  

AUTO_STICKER: process.env.AUTO_STICKER || "false",
// true/false : auto sticker  

AUTO_REPLY: process.env.AUTO_REPLY || "false",
// true/false : auto reply  

ALWAYS_ONLINE: process.env.ALWAYS_ONLINE || "false",
// true/false : always online  

PUBLIC_MODE: process.env.PUBLIC_MODE || "true",
// true/false : public mode  

AUTO_TYPING: process.env.AUTO_TYPING || "false",
// true/false : auto typing show  

READ_CMD: process.env.READ_CMD || "false",
// true/false : mark commands as read  

DEV: process.env.DEV || "923300005253",
// developer number (owner ka number)  

ANTI_VV: process.env.ANTI_VV || "false",
// true/false : anti view once  

ANTI_CALL: process.env.ANTI_CALL || "false",
// true/false : reject calls  

REJECT_MSG: process.env.REJECT_MSG || "*⛔ Sorry, Boss busy hai. Call mat karo!*",
// reject msg  

ANTI_DELETE: process.env.ANTI_DELETE || "false",
// true/false : anti delete  

ANTI_DEL_PATH: process.env.ANTI_DEL_PATH || "inbox", 
// inbox/same : deleted msg resend 

AUTO_RECORDING: process.env.AUTO_RECORDING || "false"
// true/false : auto recording show 
};
