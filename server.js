require("dotenv").config();
const express = require("express");
const nodemailer = require("nodemailer");

const app = express();

// Setup SMTP Transport with Mailgun
const transporter = nodemailer.createTransport({
    host: "smtp.mailgun.org",
    port: 587, // Use 587 (STARTTLS) or 465 (SSL)
    secure: false, // STARTTLS enabled
    auth: {
        user: process.env.MAILGUN_SMTP_USER, // Mailgun SMTP username
        pass: process.env.MAILGUN_SMTP_PASS, // Mailgun SMTP password
    },
});

// Function to verify email via SMTP handshake
async function verifyEmail(email) {
    try {
        let testResult = await transporter.verify();
        console.log("✅ SMTP Connection Successful:", testResult);

        const testMailOptions = {
            from: "verify@yourdomain.com",
            to: email,
            subject: "Test Email",
            text: "This is a test email to check SMTP connectivity.",
        };

        // Try sending an email (won't actually deliver)
        await transporter.sendMail(testMailOptions);
        console.log(`✅ Email "${email}" is valid`);
        return true;
    } catch (error) {
        console.log(`❌ Email "${email}" is invalid or blocked.`);
        return false;
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
