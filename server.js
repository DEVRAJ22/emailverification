require("dotenv").config();
const express = require("express");
const nodemailer = require("nodemailer");

const app = express();

// Use console.log to check if env variables are loaded
console.log("MAILGUN SMTP User:", process.env.MAILGUN_SMTP_USER);
console.log("MAILGUN SMTP Pass:", process.env.MAILGUN_SMTP_PASS);

const transporter = nodemailer.createTransport({
    host: "smtp.mailgun.org",
    port: 587,
    secure: false,
    auth: {
        user: process.env.MAILGUN_SMTP_USER,
        pass: process.env.MAILGUN_SMTP_PASS,
    },
});

async function verifyEmail(email) {
    try {
        const result = await transporter.verify();
        console.log("✅ SMTP Connection Successful:", result);

        return true; // SMTP is working
    } catch (error) {
        console.log("❌ SMTP Error:", error);
        return false; // SMTP failed
    }
}

app.get("/verify", async (req, res) => {
    const email = req.query.email;
    if (!email) {
        return res.json({ success: false, error: "Email is required" });
    }

    const isValid = await verifyEmail(email);
    res.json({ email, valid: isValid });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
