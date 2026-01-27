import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

export async function sendVerificationEmail(email: string, code: string) {
    if (!process.env.SMTP_USER) {
        console.warn("SMTP_USER not set. Email not sent. Code:", code);
        return;
    }

    const mailOptions = {
        from: `"Coredex Solutions" <${process.env.SMTP_USER}>`,
        to: email,
        subject: `${code} is your verification code`,
        html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #020203; color: white; border-radius: 24px;">
                <h1 style="color: #FF6B35; text-align: center; font-size: 32px; font-weight: 900; letter-spacing: -1px; font-style: italic;">COREDEX</h1>
                <p style="text-align: center; color: #64748b; text-transform: uppercase; font-size: 12px; letter-spacing: 2px; font-weight: 800;">Identity Verification</p>
                <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); border-radius: 20px; padding: 40px; margin: 30px 0; text-align: center;">
                    <p style="margin-bottom: 20px; color: #94a3b8;">Your verification code is:</p>
                    <h2 style="font-size: 48px; letter-spacing: 10px; color: white; margin: 0; font-family: monospace;">${code}</h2>
                </div>
                <p style="text-align: center; color: #475569; font-size: 12px;">This code will expire in 10 minutes. If you didn't request this, please ignore this email.</p>
                <hr style="border: 0; border-top: 1px solid rgba(255,255,255,0.05); margin: 30px 0;">
                <p style="text-align: center; color: #475569; font-size: 10px; letter-spacing: 1px; font-weight: 800;">© 2026 COREDEX SOLUTIONS</p>
            </div>
        `,
    };

    await transporter.sendMail(mailOptions);
}
