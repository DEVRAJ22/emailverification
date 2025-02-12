const net = require("net");
const express = require("express");
const fetch = require("node-fetch");

const app = express();

// Function to perform DNS MX record lookup using Google DNS API
async function checkMXRecords(domain) {
    const dnsApiUrl = `https://dns.google/resolve?name=${domain}&type=MX`;

    try {
        const response = await fetch(dnsApiUrl, { method: "GET" });
        if (response.ok) {
            const data = await response.json();
            if (data.Answer && data.Answer.length > 0) {
                const mxRecords = data.Answer.map(record => record.data);
                console.log(`✅ MX Records Found for ${domain}:`, mxRecords);
                return mxRecords; // List of MX records
            } else {
                console.log(`❌ No MX Records Found for ${domain}`);
                return null;
            }
        } else {
            console.log("❌ DNS API Error");
            return null;
        }
    } catch (error) {
        console.error("❌ DNS Lookup Error:", error);
        return null;
    }
}

// Function to verify email using SMTP handshake
async function verifyEmail(email, callback) {
    const domain = email.split("@")[1];

    const mxRecords = await checkMXRecords(domain);
    if (!mxRecords || mxRecords.length === 0) {
        return callback(false); // No MX record found
    }

    const smtpServer = mxRecords[0].split(" ")[1]; // Extract mail server address
    console.log(`📡 Using Mail Server: ${smtpServer}`);

    const client = net.createConnection(25, smtpServer, () => {
        console.log(`✅ Connected to ${smtpServer} on port 25`);
        client.write("HELO mydomain.com\r\n"); // Fake domain
        client.write(`MAIL FROM:<check@mydomain.com>\r\n`);
        client.write(`RCPT TO:<${email}>\r\n`);
        client.write("QUIT\r\n");
    });

    client.on("data", (data) => {
        const response = data.toString();
        console.log("📩 SMTP Response:", response);

        if (response.includes("250")) {
            callback(true); // Email exists
        } else {
            callback(false); // Email does not exist
        }
        client.end();
    });

    client.on("error", (err) => {
        console.error("❌ SMTP Error:", err.message);
        callback(false);
    });
}

// API Endpoint
app.get("/verify", async (req, res) => {
    const email = req.query.email;
    if (!email) {
        return res.json({ success: false, error: "Email is required" });
    }

    verifyEmail(email, (isValid) => {
        res.json({ email, valid: isValid });
    });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
