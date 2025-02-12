const net = require("net");
const dns = require("dns");

dns.setServers(["8.8.8.8", "8.8.4.4"]); // Use Google's Public DNS

// Function to get the mail server (MX record)
function getMXRecords(domain, callback) {
    dns.resolveMx(domain, (err, addresses) => {
        if (err || !addresses.length) {
            console.error(`No MX records found for: ${domain}`);
            return callback(null);
        }
        console.log(`MX records for ${domain}:`, addresses);

        // Select the mail server with the highest priority
        const mxServer = addresses.sort((a, b) => a.priority - b.priority)[0].exchange;
        console.log(`Using mail server: ${mxServer}`);
        callback(mxServer);
    });
}

// Function to verify email using SMTP handshake
function verifyEmail(email, callback) {
    const domain = email.split("@")[1];

    getMXRecords(domain, (smtpServer) => {
        if (!smtpServer) {
            return callback(false); // No MX record found
        }

        // Connect to the mail server via SMTP
        const client = net.createConnection(25, smtpServer, () => {
            console.log(`Connected to ${smtpServer} on port 25`);
            client.write("HELO mydomain.com\r\n"); // Fake domain
            client.write(`MAIL FROM:<check@mydomain.com>\r\n`);
            client.write(`RCPT TO:<${email}>\r\n`);
            client.write("QUIT\r\n");
        });

        client.on("data", (data) => {
            const response = data.toString();
            console.log("SMTP Response:", response);

            if (response.includes("250")) {
                callback(true); // Email exists
            } else {
                callback(false); // Email does not exist
            }
            client.end();
        });

        client.on("error", (err) => {
            console.error("SMTP Error:", err.message);
            callback(false);
        });
    });
}

// Simple API to check email
const express = require("express");
const app = express();

app.get("/verify", (req, res) => {
    const email = req.query.email;
    if (!email) {
        return res.json({ success: false, error: "Email is required" });
    }

    verifyEmail(email, (isValid) => {
        res.json({ email, valid: isValid });
    });
});

app.listen(3000, () => {
    console.log("Server running on http://localhost:3000");
});
