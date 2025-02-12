const express = require("express");
const net = require("net");
const fetch = globalThis.fetch || require("node-fetch");

const app = express();

// Function to check MX records via Google DNS API
async function getMXRecords(domain) {
    const dnsApiUrl = `https://dns.google/resolve?name=${domain}&type=MX`;

    try {
        const response = await fetch(dnsApiUrl);
        const data = await response.json();

        if (data.Answer && data.Answer.length > 0) {
            console.log(`✅ MX Records Found for ${domain}:`, data.Answer.map(record => record.data));
            return data.Answer.map(record => record.data); // List of MX servers
        } else {
            console.log(`❌ No MX Records Found for ${domain}`);
            return null;
        }
    } catch (error) {
        console.error("❌ DNS Lookup Error:", error.message);
        return null;
    }
}

// Function to verify email via SMTP handshake
async function verifyEmailSMTP(email) {
    return new Promise(async (resolve) => {
        const domain = email.split("@")[1];
        const mxRecords = await getMXRecords(domain);

        if (!mxRecords || mxRecords.length === 0) {
            console.log("❌ No MX records found, email is invalid.");
            return resolve(false);
        }

        const smtpServer = mxRecords[0].split(" ")[1]; // Extract mail server address
        console.log(`📡 Trying SMTP Handshake with: ${smtpServer}`);

        const client = net.createConnection(587, smtpServer, () => {
            console.log(`✅ Connected to ${smtpServer} on port 587`);
            client.write("HELO mydomain.com\r\n"); // Fake domain
            client.write("MAIL FROM:<test@mydomain.com>\r\n");
            client.write(`RCPT TO:<${email}>\r\n`);
            client.write("QUIT\r\n");
        });

        client.on("data", (data) => {
            const response = data.toString();
            console.log("📩 SMTP Response:", response);

            if (response.includes("250")) {
                resolve(true); // Email is valid
            } else {
                resolve(false); // Email is invalid
            }
            client.end();
        });

        client.on("error", (err) => {
            console.error("❌ SMTP Error:", err.message);
            resolve(false);
        });

        client.on("end", () => console.log("📤 Connection closed"));
    });
}

// API Endpoint
app.get("/verify", async (req, res) => {
    const email = req.query.email;
    if (!email) {
        return res.json({ success: false, error: "Email is required" });
    }

    const isValid = await verifyEmailSMTP(email);
    res.json({ email, valid: isValid });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
