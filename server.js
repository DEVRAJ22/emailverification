const express = require("express");
const nodemailer = require("nodemailer");

const app = express();

// Configure SMTP Transporter (Gmail Example)
const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587, // Gmail SMTP port
    secure: false, // Use STARTTLS
    auth: {
        user: process.env.SMTP_USER, // Your Gmail
        pass: process.env.SMTP_PASS, // App Password (not your Gmail password)
    },
    tls: {
        rejectUnauthorized: false,
    },
});

// Function to verify email via SMTP handshake
async function verifyEmail(email) {
    try {
        const testMailOptions = {
            from: process.env.SMTP_USER,
            to: email,
            subject: "Test Email Verification",
            text: "This is a test email to verify if the address is valid.",
        };

        await transporter.sendMail(testMailOptions);
        console.log(`✅ Email ${email} is valid`);
        return true; // Email is valid
    } catch (error) {
        console.error(`❌ SMTP Error for ${email}:`, error.message);
        return false; // Email is invalid
    }
}

// API Endpoint
app.get("/verify", async (req, res) => {
    const email = req.query.email;
    if (!email) {
        return res.json({ success: false, error: "Email is required" });
    }

    const isValid = await verifyEmail(email);
    res.json({ email, valid: isValid });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
