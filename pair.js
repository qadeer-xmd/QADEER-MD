/**
 * 🔑 QADEER-MD Pairing Script
 * یہ script WhatsApp نمبر سے Session Id generate کرنے کے لیے ہے
 */

const express = require("express");
const makeWASocket = require("@whiskeysockets/baileys").default;
const { useMultiFileAuthState, fetchLatestBaileysVersion } = require("@whiskeysockets/baileys");
const qrcode = require("qrcode");

const app = express();
const PORT = process.env.PORT || 5000;

app.get("/", (req, res) => {
  res.send("✅ QADEER-MD Pair Server is running! <br> Visit /pair to get Session Id.");
});

app.get("/pair", async (req, res) => {
  try {
    const { state, saveCreds } = await useMultiFileAuthState("auth_info_pair");
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
      auth: state,
      version,
      printQRInTerminal: true,
    });

    let qrCodeData = "";

    sock.ev.on("connection.update", async (update) => {
      const { qr, connection } = update;
      if (qr) {
        qrCodeData = await qrcode.toDataURL(qr);
        res.send(`
          <h2>📲 QADEER-MD Pair</h2>
          <p>Scan this QR code in your WhatsApp linked devices:</p>
          <img src="${qrCodeData}" />
          <p>After scan, check your server logs for Session Id ✅</p>
        `);
      }
      if (connection === "open") {
        console.log("✅ Connected successfully!");
      }
    });

    sock.ev.on("creds.update", async () => {
      await saveCreds();
      const creds = require("fs").readFileSync("./auth_info_pair/creds.json");
      console.log("🔑 Your Session Id:", creds.toString());
    });
  } catch (e) {
    console.error("❌ Error in Pair:", e);
    res.send("❌ Error: " + e.message);
  }
});

app.listen(PORT, () => {
  console.log(`🌐 QADEER-MD Pair server running on http://localhost:${PORT}`);
});
