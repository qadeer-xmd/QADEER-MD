const express = require("express");
const qrcode = require("qrcode");
const app = express();
const port = process.env.PORT || 3000;

app.use(express.static("public"));

app.get("/", (req, res) => {
  res.send("<h2>💥 QADEER-MD • QR Code Generator 💥</h2><p>Go to <a href='/qr?text=QADEER-MD'>/qr</a> to generate your QR.</p>");
});

app.get("/qr", async (req, res) => {
  try {
    let text = req.query.text || "QADEER-MD • Powered By Qadeer Brahvi";
    const qr = await qrcode.toDataURL(text);
    res.send(`
      <html>
        <head>
          <title>QADEER-MD QR</title>
        </head>
        <body style="text-align:center; font-family:Arial; background:#0f172a; color:white;">
          <h1 style="color:#38bdf8;">💥 QADEER-MD 💥</h1>
          <p><b>Powered By Qadeer Brahvi</b></p>
          <img src="https://files.catbox.moe/sidq95.jpg" alt="Bot Logo" width="200" style="border-radius:20px; margin:10px;"/>
          <p>👇 Scan this QR to connect 👇</p>
          <img src="${qr}" alt="QR Code" style="margin-top:20px; width:250px; height:250px; border:5px solid #38bdf8; border-radius:15px;"/>
        </body>
      </html>
    `);
  } catch (err) {
    res.status(500).send("Error generating QR code ❌");
  }
});

app.listen(port, () => {
  console.log(`✅ QADEER-MD QR Server Running on http://localhost:${port}`);
});
