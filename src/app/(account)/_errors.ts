// Arabic for the error messages the sign-in, password and signup APIs send. The APIs answer in
// English; the account pages run every error through accountError when the page is in Arabic.
// An unknown message becomes a general Arabic error rather than showing English.
import type { SiteLang } from "../_landing/copy";

const GENERIC = "حدث خطأ. يُرجى المحاولة مرة أخرى.";

const AR: Record<string, string> = {
  // Shared
  "Too many requests. Please try again later.": "محاولات كثيرة. حاول مرة أخرى بعد قليل.",
  "Internal server error": GENERIC,
  "Something went wrong. Please try again.": GENERIC,

  // Sign in
  "Enter your email and password.": "أدخل البريد الإلكتروني وكلمة المرور.",
  "That email and password don’t match.": "البريد الإلكتروني وكلمة المرور غير متطابقين.",
  "Your access has been paused. Ask the restaurant owner to turn it back on.": "تم إيقاف وصولك مؤقتاً. اطلب من صاحب المطعم إعادة تفعيله.",
  "This restaurant is suspended. Contact Coredex.": "هذا المطعم موقوف حالياً. تواصل مع Coredex.",
  "Sign-in failed. Please try again.": "تعذّر تسجيل الدخول. حاول مرة أخرى.",

  // Forgot and reset password
  "Enter the email you sign in with.": "أدخل البريد الذي تسجّل الدخول به.",
  "We could not send the email. Please try again in a few minutes.": "تعذّر إرسال البريد. حاول مرة أخرى بعد دقائق.",
  "This reset link has expired or was already used. Ask for a new one.": "انتهت صلاحية رابط إعادة التعيين أو سبق استخدامه. اطلب رابطاً جديداً.",
  "This link no longer works.": "هذا الرابط لم يعد يعمل.",
  "Couldn't check the link. Check your connection and reload.": "تعذّر التحقق من الرابط. تحقّق من اتصالك وأعد تحميل الصفحة.",
  "Use at least 8 characters.": "استخدم 8 أحرف على الأقل.",
  "Could not change the password. Please try again.": "تعذّر تغيير كلمة المرور. حاول مرة أخرى.",
  "Couldn't change the password. Please try again.": "تعذّر تغيير كلمة المرور. حاول مرة أخرى.",

  // Signup: email code
  "A valid email is required": "أدخل بريداً إلكترونياً صحيحاً.",
  "Failed to send verification email": "تعذّر إرسال رمز التحقق إلى بريدك. حاول مرة أخرى بعد قليل.",
  "Email and code are required": "أدخل الرمز المكوّن من 6 أرقام.",
  "Invalid or expired code": "الرمز غير صحيح أو انتهت صلاحيته. اطلب رمزاً جديداً.",

  // Signup: account
  "Please fill in all required fields": "املأ كل الحقول المطلوبة.",
  "Please verify your email address first.": "أكّد بريدك الإلكتروني أولاً.",
  "Password must be at least 8 characters.": "يجب أن تتكوّن كلمة المرور من 8 أحرف على الأقل.",
  "The URL must be 3-50 characters: lowercase letters, numbers and single hyphens.":
    "يجب أن يتكوّن الرابط من 3 إلى 50 حرفاً: أحرف إنجليزية صغيرة وأرقام وشرطات مفردة.",
  "This URL is already taken. Please choose another one.": "هذا الرابط مستخدم. اختر رابطاً آخر.",
  "Internal server error during registration": "تعذّر إنشاء الحساب. حاول مرة أخرى.",
};

/** The message in the page's language (English messages stay as they are) */
export function accountError(message: string, lang: SiteLang): string {
  if (lang !== "ar") return message;
  return AR[message.trim()] ?? GENERIC;
}

export const ACCOUNT_ERRORS_AR = AR;
