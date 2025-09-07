/**
 * 💥 QADEER-MD PAIRING SYSTEM 💥
 * Made with 💖 by Qadeer Brahvi
 */

const express = require("express");
const { Boom } = require("@hapi/boom");
const {
  default: makeWASocket,
  makeCacheableSignalKeyStore,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  makeInMemoryStore,
  DisconnectReason,
  jidNormalizedUser,
  PHONENUMBER_MCC
} = require("@whiskeysockets/baileys");

const pino = require("pino");
const qrcode = require("qrcode");
const fs = require("fs");

const PORT = process.env.PORT || 3000;
const app = express();

let pairingCode = null;

// 🌐 Home Page
app.get("/", (req, res) => {
  res.send(`
    <center>
      <h1>💥 QADEER-MD PAIRING 💥</h1>
      <p>👇 Click below to get your WhatsApp Pairing Code 👇</p>
      <a href="/pair"><button style="padding:10px;background:green;color:white;border:none;border-radius:5px;">Get Pairing Code</button></a>
      <br><br>
      <p>© Powered by Qadeer-MD</p>
      <img src="https://files.catbox.moe/sidq95.jpg" width="250"/>
    </center>
  `);
});

// 🚀 Pairing Endpoint
app.get("/pair", async (req, res) => {
  try {
    const { state, saveCreds } = await useMultiFileAuthState("auth_info");
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
      version,
      logger: pino({ level: "silent" }),
      printQRInTerminal: false,
      browser: ["QADEER-MD", "Chrome", "5.0"],
      auth: state,
    });

    sock.ev.on("connection.update", async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        const qrImage = await qrcode.toDataURL(qr, { scale: 8 });
        res.send(`
          <center>
            <h2>📱 Scan this QR with WhatsApp</h2>
            <img src="${qrImage}" width="300"/>
            <p>Open WhatsApp > Linked Devices > Link a Device</p>
            <br>
            <p>© Powered by QADEER-MD</p>
          </center>
        `);
      }

      if (connection === "open") {
        console.log("✅ Connected!");
        res.send("<h1>✅ QADEER-MD Successfully Connected!</h1>");
        await saveCreds();
      }

      if (connection === "close") {
        let reason = new Boom(lastDisconnect?.error)?.output.statusCode;
        console.log("❌ Connection closed", reason);
      }
    });

    sock.ev.on("creds.update", saveCreds);
  } catch (e) {
    console.error("❌ Pairing Error:", e);
    res.send("<h2>❌ Something went wrong. Please try again.</h2>");
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`🌍 QADEER-MD Pairing Server Running on Port ${PORT}`);
});
