import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/client';
import { signPasswordResetToken } from '@/lib/auth/jwt';
import { sendBrandedEmail } from '@/lib/email';
import { checkRateLimit, rateLimitResponse, RATE_LIMITS } from '@/lib/rate-limit/middleware';
import { getBaseUrl } from '@/lib/utils/base-url';

const PER_EMAIL = { windowMs: 60 * 60 * 1000, maxRequests: 3, keyPrefix: 'reset-email' };

const COPY = {
  en: {
    subject: 'Reset your Coredex password',
    intro: 'Someone asked to reset the password for this email on Coredex. If it was you, use the link below. It works once and expires in 30 minutes.',
    several: 'This email signs in to more than one restaurant. Each link resets the password for that restaurant only.',
    button: (name: string) => `Reset password for ${name}`,
    footer: "If you didn't ask for this, you can ignore this email. Your password stays the same.",
  },
  ar: {
    subject: 'إعادة تعيين كلمة المرور في Coredex',
    intro: 'طلب أحدهم إعادة تعيين كلمة المرور لهذا البريد في Coredex. إذا كنت أنت، استخدم الرابط أدناه. يعمل الرابط مرة واحدة وتنتهي صلاحيته بعد 30 دقيقة.',
    several: 'هذا البريد مرتبط بأكثر من مطعم. كل رابط يعيد تعيين كلمة المرور لمطعم واحد فقط.',
    button: (name: string) => `إعادة تعيين كلمة المرور لـ ${name}`,
    footer: 'إذا لم تطلب ذلك، تجاهل هذه الرسالة. كلمة المرور تبقى كما هي.',
  },
};

// POST { email, lang? }: always answers the same way, whether or not the email has an account
export async function POST(request: NextRequest) {
  const perIp = await checkRateLimit(request, { ...RATE_LIMITS.sendCode, keyPrefix: 'reset' });
  if (!perIp.allowed) return rateLimitResponse(RATE_LIMITS.sendCode, perIp.resetAt);

  const body = await request.json().catch(() => null);
  const email = typeof body?.email === 'string' ? body.email.toLowerCase().trim() : '';
  const lang = body?.lang === 'ar' ? 'ar' : 'en';
  if (!email || !email.includes('@') || email.length > 254) {
    return NextResponse.json({ error: 'Enter the email you sign in with.' }, { status: 400 });
  }

  const perEmail = await checkRateLimit(request, PER_EMAIL, `email:${email}`);
  if (!perEmail.allowed) return rateLimitResponse(PER_EMAIL, perEmail.resetAt);

  try {
    const db = getDb();
    const result = await db.execute({
      sql: `
        SELECT ca.id, ca.password_hash, c.name AS catalog_name
        FROM catalog_admins ca
        JOIN catalogs c ON c.id = ca.catalog_id
        WHERE LOWER(ca.email) = ? AND ca.is_active = 1 AND c.is_suspended = 0
        ORDER BY c.name
      `,
      args: [email],
    });

    if (result.rows.length > 0) {
      const t = COPY[lang];
      const base = getBaseUrl(request);
      const links = result.rows.map((row) => ({
        name: row.catalog_name as string,
        url: `${base}/reset-password/?token=${encodeURIComponent(signPasswordResetToken(row.id as string, row.password_hash as string))}`,
      }));
      // One email per restaurant keeps each message to a single, clear button
      for (const link of links) {
        await sendBrandedEmail({
          to: email,
          subject: links.length > 1 ? `${t.subject} · ${link.name}` : t.subject,
          paragraphs: links.length > 1 ? [t.intro, t.several] : [t.intro],
          button: { label: t.button(link.name), url: link.url },
          footer: t.footer,
          dir: lang === 'ar' ? 'rtl' : 'ltr',
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json({ error: 'We could not send the email. Please try again in a few minutes.' }, { status: 500 });
  }
}
