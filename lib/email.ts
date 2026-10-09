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
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        // In production a missing mail setup must surface as an error, not a silent "Code sent"
        if (process.env.NODE_ENV === "production") throw new Error("SMTP_USER / SMTP_PASS are not set");
        console.warn(`[dev] SMTP is not configured, so no email was sent. Verification code for ${email}: ${code}`);
        return;
    }

    const from = process.env.EMAIL_FROM || process.env.SMTP_USER;
    const mailOptions = {
        from: `"Coredex" <${from}>`,
        to: email,
        subject: `${code} is your Coredex verification code`,
        text: `Your Coredex verification code is ${code}. It expires in 10 minutes. If you didn't request it, you can ignore this email.`,
        html: `
            <div style="font-family: Inter, Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; background: #F7F8F5; color: #172B26;">
                <p style="margin: 0 0 24px; font-size: 18px; font-weight: 600; color: #0F6B5B;">Coredex</p>
                <div style="background: #FFFFFF; border: 1px solid #DDE3DF; border-radius: 16px; padding: 28px; text-align: center;">
                    <p style="margin: 0 0 12px; font-size: 16px;">Your verification code</p>
                    <p style="margin: 0; font-size: 36px; font-weight: 600; letter-spacing: 8px; color: #0F6B5B;">${code}</p>
                    <p style="margin: 16px 0 0; font-size: 14px; color: #5B6B66;">It expires in 10 minutes.</p>
                </div>
                <p style="margin: 24px 0 0; font-size: 13px; color: #5B6B66;">If you didn't ask for this code, you can ignore this email.</p>
            </div>
        `,
    };

    await transporter.sendMail(mailOptions);
}
