const net = require("net");
const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());

function verifyEmail(email, callback) {
    const domain = email.split("@")[1];
    const smtpServer = `mx.${domain}`;

    const client = net.createConnection(25, smtpServer, () => {
        console.log(`Connected to ${smtpServer}`);
        client.write(`HELO yourdomain.com\r\n`);
        client.write(`MAIL FROM:<check@yourdomain.com>\r\n`);
        client.write(`RCPT TO:<${email}>\r\n`);
    });

    client.on("data", (data) => {
        const response = data.toString();
        if (response.includes("250")) {
            callback(true); // Email exists
        } else {
            callback(false); // Email doesn't exist
        }
        client.end();
    });

    client.on("error", (err) => {
        console.error("SMTP error:", err);
        callback(false);
    });
}

app.get("/verify", (req, res) => {
    const email = req.query.email;
    if (!email) return res.status(400).json({ error: "Email required" });

    verifyEmail(email, (isValid) => {
        res.json({ email, valid: isValid });
    });
});

app.listen(3000, () => console.log("SMTP API running on http://localhost:3000"));
