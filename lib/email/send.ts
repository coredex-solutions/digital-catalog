/**
 * Email sending utilities using Nodemailer
 *
 * Configure via environment variables:
 * - SMTP_HOST: SMTP server host (e.g., smtp.gmail.com)
 * - SMTP_PORT: SMTP port (default: 587)
 * - SMTP_SECURE: Use TLS (true/false, default: false for port 587)
 * - SMTP_USER: SMTP username/email
 * - SMTP_PASS: SMTP password or app password
 * - EMAIL_FROM: Default from address
 */

import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
}

// Singleton transporter instance
let transporter: Transporter | null = null;

/**
 * Get or create the nodemailer transporter
 */
function getTransporter(): Transporter | null {
  if (transporter) return transporter;

  // Check if SMTP is configured
  if (
    !process.env.SMTP_HOST ||
    !process.env.SMTP_USER ||
    !process.env.SMTP_PASS
  ) {
    return null;
  }

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  return transporter;
}

/**
 * Check if email sending is configured
 */
export function isEmailConfigured(): boolean {
  return Boolean(
    process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS
  );
}

/**
 * Send an email using Nodemailer
 * In development without SMTP config, logs to console
 */
export async function sendEmail(
  options: EmailOptions
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const { to, subject, html, text, from } = options;
  const fromAddress =
    from || process.env.EMAIL_FROM || "noreply@digitalcatalog.app";

  // Development mode or no SMTP config - just log
  if (process.env.NODE_ENV === "development" && !isEmailConfigured()) {
    console.log("📧 Email (dev mode - no SMTP configured):");
    console.log("  From:", fromAddress);
    console.log("  To:", to);
    console.log("  Subject:", subject);
    console.log("  Content:", text || html.substring(0, 200) + "...");
    return { success: true, messageId: "dev-mode" };
  }

  const transport = getTransporter();

  if (!transport) {
    console.error(
      "Email not configured: SMTP_HOST, SMTP_USER, or SMTP_PASS missing"
    );
    return { success: false, error: "Email not configured" };
  }

  try {
    const info = await transport.sendMail({
      from: fromAddress,
      to,
      subject,
      html,
      text: text || undefined,
    });

    console.log("📧 Email sent:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error("Email send failed:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Verify SMTP connection
 */
export async function verifyEmailConnection(): Promise<boolean> {
  const transport = getTransporter();
  if (!transport) return false;

  try {
    await transport.verify();
    return true;
  } catch {
    return false;
  }
}

/**
 * Email templates
 */
export const emailTemplates = {
  // Welcome email for new catalog admin
  welcomeAdmin: (name: string, catalogName: string, loginUrl: string) => ({
    subject: `Welcome to ${catalogName}!`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; padding: 20px 0; }
          .button { display: inline-block; padding: 12px 24px; background: #10b981; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; }
          .footer { text-align: center; padding: 20px 0; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome, ${name}!</h1>
          </div>
          <p>You've been added as an admin for <strong>${catalogName}</strong>.</p>
          <p>You can now log in to manage your catalog, add products, update settings, and more.</p>
          <p style="text-align: center; padding: 20px 0;">
            <a href="${loginUrl}" class="button">Log In to Dashboard</a>
          </p>
          <div class="footer">
            <p>Digital Catalog Platform</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `Welcome, ${name}!\n\nYou've been added as an admin for ${catalogName}.\n\nLog in at: ${loginUrl}`,
  }),

  // Password reset email
  passwordReset: (name: string, resetUrl: string) => ({
    subject: "Reset Your Password",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; padding: 20px 0; }
          .button { display: inline-block; padding: 12px 24px; background: #10b981; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; }
          .footer { text-align: center; padding: 20px 0; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Reset Your Password</h1>
          </div>
          <p>Hi ${name},</p>
          <p>We received a request to reset your password. Click the button below to create a new password:</p>
          <p style="text-align: center; padding: 20px 0;">
            <a href="${resetUrl}" class="button">Reset Password</a>
          </p>
          <p>This link will expire in 1 hour.</p>
          <p>If you didn't request this, you can safely ignore this email.</p>
          <div class="footer">
            <p>Digital Catalog Platform</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `Hi ${name},\n\nWe received a request to reset your password.\n\nReset your password: ${resetUrl}\n\nThis link will expire in 1 hour.`,
  }),

  // Subscription expiring soon
  subscriptionExpiring: (
    catalogName: string,
    daysLeft: number,
    renewUrl: string
  ) => ({
    subject: `Your ${catalogName} subscription is expiring soon`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; padding: 20px 0; }
          .warning { background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 16px; margin: 20px 0; }
          .button { display: inline-block; padding: 12px 24px; background: #10b981; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; }
          .footer { text-align: center; padding: 20px 0; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Subscription Expiring</h1>
          </div>
          <div class="warning">
            <strong>⚠️ Your subscription for ${catalogName} will expire in ${daysLeft} days.</strong>
          </div>
          <p>To keep your catalog active and accessible to your customers, please renew your subscription.</p>
          <p style="text-align: center; padding: 20px 0;">
            <a href="${renewUrl}" class="button">Renew Subscription</a>
          </p>
          <div class="footer">
            <p>Digital Catalog Platform</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `Your subscription for ${catalogName} will expire in ${daysLeft} days.\n\nRenew at: ${renewUrl}`,
  }),

  // New catalog created (for super admin notification)
  catalogCreated: (
    catalogName: string,
    catalogSlug: string,
    adminEmail: string
  ) => ({
    subject: `New catalog created: ${catalogName}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; padding: 20px 0; }
          .info { background: #f0fdf4; border: 1px solid #22c55e; border-radius: 8px; padding: 16px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px 0; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>New Catalog Created</h1>
          </div>
          <div class="info">
            <p><strong>Catalog:</strong> ${catalogName}</p>
            <p><strong>Slug:</strong> ${catalogSlug}</p>
            <p><strong>Admin Email:</strong> ${adminEmail}</p>
          </div>
          <div class="footer">
            <p>Digital Catalog Platform</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `New catalog created:\n\nName: ${catalogName}\nSlug: ${catalogSlug}\nAdmin: ${adminEmail}`,
  }),

  // Account created with credentials (sent to new catalog admin)
  accountCreated: (
    name: string,
    catalogName: string,
    email: string,
    password: string,
    loginUrl: string,
    catalogUrl: string
  ) => ({
    subject: `Your ${catalogName} Account Has Been Created`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5; }
          .wrapper { padding: 40px 20px; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 20px; text-align: center; }
          .header h1 { color: white; margin: 0; font-size: 28px; }
          .header p { color: rgba(255,255,255,0.9); margin: 10px 0 0; }
          .content { padding: 40px 30px; }
          .greeting { font-size: 20px; font-weight: 600; margin-bottom: 20px; }
          .credentials { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 24px 0; }
          .credentials p { margin: 8px 0; }
          .credentials strong { color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
          .credentials .value { font-size: 16px; color: #1e293b; font-family: monospace; background: white; padding: 8px 12px; border-radius: 6px; margin-top: 4px; display: block; border: 1px solid #e2e8f0; }
          .warning { background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 16px; margin: 20px 0; font-size: 14px; }
          .warning strong { color: #92400e; }
          .button { display: inline-block; padding: 14px 28px; background: #10b981; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 8px 4px; }
          .button.secondary { background: #1e293b; }
          .buttons { text-align: center; padding: 20px 0; }
          .links { background: #f8fafc; padding: 20px 30px; border-top: 1px solid #e2e8f0; }
          .links p { margin: 8px 0; font-size: 14px; color: #64748b; }
          .links a { color: #10b981; }
          .footer { text-align: center; padding: 30px; color: #64748b; font-size: 14px; border-top: 1px solid #e2e8f0; }
        </style>
      </head>
      <body>
        <div class="wrapper">
          <div class="container">
            <div class="header">
              <h1>🎉 Welcome Aboard!</h1>
              <p>Your digital catalog is ready</p>
            </div>
            <div class="content">
              <p class="greeting">Hello ${name},</p>
              <p>Great news! Your account for <strong>${catalogName}</strong> has been created and your digital catalog is ready to go.</p>
              
              <div class="credentials">
                <p>
                  <strong>Login Email</strong>
                  <span class="value">${email}</span>
                </p>
                <p>
                  <strong>Temporary Password</strong>
                  <span class="value">${password}</span>
                </p>
              </div>

              <div class="warning">
                <strong>⚠️ Security Notice:</strong> Please change your password after your first login for security purposes.
              </div>

              <div class="buttons">
                <a href="${loginUrl}" class="button">Log In to Dashboard</a>
                <a href="${catalogUrl}" class="button secondary">View Your Catalog</a>
              </div>
            </div>
            
            <div class="links">
              <p><strong>Dashboard:</strong> <a href="${loginUrl}">${loginUrl}</a></p>
              <p><strong>Your Catalog:</strong> <a href="${catalogUrl}">${catalogUrl}</a></p>
            </div>

            <div class="footer">
              <p>Need help? Just reply to this email.</p>
              <p>© Digital Catalog Platform</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `Hello ${name},

Your account for ${catalogName} has been created!

Login Credentials:
Email: ${email}
Password: ${password}

Please change your password after your first login.

Dashboard: ${loginUrl}
Your Catalog: ${catalogUrl}

Need help? Just reply to this email.

© Digital Catalog Platform`,
  }),
};
