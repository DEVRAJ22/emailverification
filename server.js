const express = require("express");
const net = require("net");
const dns = require("dns");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.post("/verify-email", async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email is required" });

    try {
        const result = await checkEmail(email);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error });
    }
});

app.get("/verify-email", async (req, res) => {
    const email = req.query.email; // Get email from URL parameter
    if (!email) return res.status(400).json({ error: "Email is required" });

    try {
        const result = await checkEmail(email);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error });
    }
});


async function checkEmail(email) {
    const domain = email.split("@")[1];

    return new Promise((resolve, reject) => {
        dns.resolveMx(domain, (err, addresses) => {
            if (err || !addresses || addresses.length === 0) {
                return reject(`❌ No MX records found for ${domain}`);
            }

            addresses.sort((a, b) => a.priority - b.priority);
            const mxHost = addresses[0].exchange;
            console.log(`✅ Using mail server: ${mxHost}`);

            const socket = net.createConnection(25, mxHost);
            let timeout = setTimeout(() => {
                socket.destroy();
                reject("❌ Connection timeout.");
            }, 10000);

            socket.setEncoding("ascii");
            let step = 0;

            socket.on("data", (data) => {
                console.log(`📩 SMTP Response: ${data}`);

                if (data.includes("220") && step === 0) {
                    step++;
                    socket.write(`HELO example.com\r\n`);
                } else if (data.includes("250") && step === 1) {
                    step++;
                    socket.write(`MAIL FROM:<test@example.com>\r\n`);
                } else if (data.includes("250") && step === 2) {
                    step++;
                    socket.write(`RCPT TO:<${email}>\r\n`);
                } else if (data.includes("550")) {
                    clearTimeout(timeout);
                    resolve({ success: false, message: `❌ Email ${email} does NOT exist.` });
                    socket.end();
                } else if (data.includes("250")) {
                    clearTimeout(timeout);
                    resolve({ success: true, message: `✅ Email ${email} can receive emails.` });
                    socket.end();
                }
            });

            socket.on("error", (error) => {
                clearTimeout(timeout);
                reject(`❌ Connection error: ${error.message}`);
            });

            socket.on("end", () => {
                clearTimeout(timeout);
                console.log("🔄 SMTP session ended.");
            });
        });
    });
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => console.log(`🚀 Server running on port ${PORT}`));
