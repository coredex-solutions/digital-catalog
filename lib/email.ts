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

/** Where Coredex staff are told about plan requests (defaults to the sending mailbox) */
export function opsEmail(): string | undefined {
    return process.env.OPS_EMAIL || process.env.EMAIL_FROM || process.env.SMTP_USER || undefined;
}

const escapeHtml = (value: string) =>
    value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** SMTP_USER and SMTP_PASS are set, so emails are really sent (not just printed in the terminal) */
export function isEmailConfigured(): boolean {
    return Boolean(process.env.SMTP_USER && process.env.SMTP_PASS);
}

/** Send through SMTP. Without SMTP settings this throws in production and logs in development. */
async function deliver(to: string, subject: string, text: string, html: string) {
    if (!isEmailConfigured()) {
        // In production a missing mail setup must surface as an error, not a silent "sent"
        if (process.env.NODE_ENV === "production") throw new Error("SMTP_USER / SMTP_PASS are not set");
        console.warn(`[dev] SMTP is not configured, so no email was sent.\nTo: ${to}\nSubject: ${subject}\n${text}`);
        return;
    }
    const from = process.env.EMAIL_FROM || process.env.SMTP_USER;
    await transporter.sendMail({ from: `"Coredex" <${from}>`, to, subject, text, html });
}

interface BrandedEmail {
    to: string;
    subject: string;
    /** Short paragraphs of plain text, shown in order */
    paragraphs: string[];
    button?: { label: string; url: string };
    /** Small print under the card */
    footer?: string;
    /** Arabic content is laid out right to left */
    dir?: "ltr" | "rtl";
}

/** A simple Coredex-styled email (Violet & Indigo palette) with a plain-text twin */
export async function sendBrandedEmail({ to, subject, paragraphs, button, footer, dir = "ltr" }: BrandedEmail) {
    const align = dir === "rtl" ? "right" : "left";
    const body = paragraphs
        .map((p) => `<p style="margin: 0 0 14px; font-size: 16px; line-height: 1.6;">${escapeHtml(p)}</p>`)
        .join("");
    const cta = button
        ? `<p style="margin: 22px 0 6px;"><a href="${escapeHtml(button.url)}" style="display: inline-block; background: #4028C9; color: #FFFFFF; text-decoration: none; font-weight: 600; padding: 12px 22px; border-radius: 10px;">${escapeHtml(button.label)}</a></p>
           <p style="margin: 10px 0 0; font-size: 13px; color: #62657A; word-break: break-all;">${escapeHtml(button.url)}</p>`
        : "";
    const html = `
        <div dir="${dir}" style="font-family: Inter, Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px; background: #F7F8FC; color: #17152E; text-align: ${align};">
            <p style="margin: 0 0 24px; font-size: 18px; font-weight: 600; color: #4028C9;">Coredex</p>
            <div style="background: #FFFFFF; border: 1px solid #E0E3EF; border-radius: 16px; padding: 28px;">${body}${cta}</div>
            ${footer ? `<p style="margin: 24px 0 0; font-size: 13px; color: #62657A;">${escapeHtml(footer)}</p>` : ""}
        </div>`;
    const text = [...paragraphs, button ? `${button.label}: ${button.url}` : "", footer || ""].filter(Boolean).join("\n\n");
    await deliver(to, subject, text, html);
}

const VERIFICATION_COPY = {
    en: {
        subject: (code: string) => `${code} is your Coredex verification code`,
        text: (code: string) => `Your Coredex verification code is ${code}. It expires in 10 minutes. If you didn't request it, you can ignore this email.`,
        heading: "Your verification code",
        expires: "It expires in 10 minutes.",
        ignore: "If you didn't ask for this code, you can ignore this email.",
    },
    ar: {
        subject: (code: string) => `${code} هو رمز التحقق من Coredex`,
        text: (code: string) => `رمز التحقق من Coredex هو ${code}. تنتهي صلاحيته بعد 10 دقائق. إذا لم تطلبه، يمكنك تجاهل هذه الرسالة.`,
        heading: "رمز التحقق",
        expires: "تنتهي صلاحيته بعد 10 دقائق.",
        ignore: "إذا لم تطلب هذا الرمز، يمكنك تجاهل هذه الرسالة.",
    },
};

export async function sendVerificationEmail(email: string, code: string, lang: "en" | "ar" = "en") {
    const t = VERIFICATION_COPY[lang];
    const dir = lang === "ar" ? "rtl" : "ltr";
    await deliver(
        email,
        t.subject(code),
        t.text(code),
        `
            <div dir="${dir}" style="font-family: Inter, Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; background: #F7F8FC; color: #17152E; text-align: ${dir === "rtl" ? "right" : "left"};">
                <p style="margin: 0 0 24px; font-size: 18px; font-weight: 600; color: #4028C9;">Coredex</p>
                <div style="background: #FFFFFF; border: 1px solid #E0E3EF; border-radius: 16px; padding: 28px; text-align: center;">
                    <p style="margin: 0 0 12px; font-size: 16px;">${t.heading}</p>
                    <p dir="ltr" style="margin: 0; font-size: 36px; font-weight: 600; letter-spacing: 8px; color: #4028C9;">${code}</p>
                    <p style="margin: 16px 0 0; font-size: 14px; color: #62657A;">${t.expires}</p>
                </div>
                <p style="margin: 24px 0 0; font-size: 13px; color: #62657A;">${t.ignore}</p>
            </div>
        `
    );
}
