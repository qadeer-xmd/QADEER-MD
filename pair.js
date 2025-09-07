const express = require("express");
const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion } = require("@whiskeysockets/baileys");
const qrcode = require("qrcode");
const { Boom } = require("@hapi/boom");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", async (req, res) => {
    try {
        const { state, saveCreds } = await useMultiFileAuthState("session");
        const { version } = await fetchLatestBaileysVersion();

        const sock = makeWASocket({
            version,
            printQRInTerminal: false,
            auth: state
        });

        sock.ev.on("connection.update", async (update) => {
            const { qr, connection, lastDisconnect } = update;

            if (qr) {
                qrcode.toDataURL(qr, (err, url) => {
                    res.send(`
                        <html>
                        <head>
                          <title>QADEER-MD Pair</title>
                          <style>
                            body {
                              font-family: Arial, sans-serif;
                              background: #0f172a;
                              color: white;
                              text-align: center;
                              padding: 40px;
                            }
                            .card {
                              background: #1e293b;
                              border-radius: 12px;
                              padding: 20px;
                              max-width: 450px;
                              margin: auto;
                              box-shadow: 0px 4px 15px rgba(0,0,0,0.5);
                            }
                            h1 {
                              color: #38bdf8;
                            }
                            img.qr {
                              margin-top: 20px;
                              border: 5px solid #38bdf8;
                              border-radius: 10px;
                            }
                            img.logo {
                              width: 120px;
                              height: 120px;
                              border-radius: 50%;
                              margin-bottom: 20px;
                              border: 3px solid #38bdf8;
                            }
                          </style>
                        </head>
                        <body>
                          <div class="card">
                            <img src="https://files.catbox.moe/sidq95.jpg" class="logo" />
                            <h1>🤖 QADEER-MD PAIR 🤖</h1>
                            <p>📲 Scan this QR Code with WhatsApp</p>
                            <img class="qr" src="${url}" />
                            <p style="margin-top:15px;">After scanning, refresh page to get your Session ID ✅</p>
                          </div>
                        </body>
                        </html>
                    `);
                });
            }

            if (connection === "open") {
                console.log("✅ Paired Successfully!");
                let sessionData = fs.readFileSync("./session/creds.json", "utf8");
                res.send(`
                    <html>
                    <head>
                      <title>Session ID - QADEER-MD</title>
                      <style>
                        body {
                          font-family: Arial, sans-serif;
                          background: #0f172a;
                          color: white;
                          text-align: center;
                          padding: 40px;
                        }
                        .card {
                          background: #1e293b;
                          border-radius: 12px;
                          padding: 20px;
                          max-width: 600px;
                          margin: auto;
                          box-shadow: 0px 4px 15px rgba(0,0,0,0.5);
                        }
                        img.logo {
                          width: 120px;
                          height: 120px;
                          border-radius: 50%;
                          margin-bottom: 20px;
                          border: 3px solid #38bdf8;
                        }
                        textarea {
                          width: 90%;
                          height: 200px;
                          margin-top: 15px;
                          border-radius: 8px;
                          padding: 10px;
                          font-family: monospace;
                          background: #0f172a;
                          color: #38bdf8;
                          border: 1px solid #38bdf8;
                        }
                      </style>
                    </head>
                    <body>
                      <div class="card">
                        <img src="https://files.catbox.moe/sidq95.jpg" class="logo" />
                        <h2>✅ Session Generated Successfully</h2>
                        <textarea readonly>${sessionData}</textarea>
                        <p>⚡ Copy this Session ID and paste it in Heroku Config Vars</p>
                        <h3>© Powered by Qadeer-MD</h3>
                      </div>
                    </body>
                    </html>
                `);
                process.exit(0);
            }

            if (connection === "close") {
                let reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
                if (reason === 401) {
                    console.log("🔴 Session expired. Please re-pair.");
                }
            }
        });

        sock.ev.on("creds.update", saveCreds);
    } catch (err) {
        console.error(err);
        res.send("❌ Error while generating session.");
    }
});

app.listen(PORT, () => {
    console.log(`⚡ QADEER-MD Pair Server running on PORT ${PORT}`);
});
