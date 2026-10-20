// Arabic for the error messages the dashboard's APIs send. The APIs answer in English; the
// dashboard's fetch helper (CatalogAdminShell's fetchWithAuth) runs every `error` and `message`
// through translateApiMessage when the dashboard is in Arabic. A message without a translation
// falls back to a general Arabic one rather than showing English.
// scratchpad check: every error string in src/app/api/c, src/app/api/ai and lib must match here.

import type { AdminLang } from "./i18n";

const GENERIC = "حدث خطأ. يُرجى المحاولة مرة أخرى.";

const EXACT: Record<string, string> = {
  // Access and accounts
  "Access denied to this catalog": "ليس لديك صلاحية الوصول إلى هذه القائمة.",
  "Account is deactivated": "تم إيقاف هذا الحساب.",
  "Admin not found": "الحساب غير موجود.",
  "User not found": "الحساب غير موجود.",
  "Super admin not found": "الحساب غير موجود.",
  "Catalog is suspended or inactive": "هذه القائمة موقوفة حالياً.",
  "Catalog is suspended": "هذه القائمة موقوفة حالياً.",
  "Catalog not found": "القائمة غير موجودة.",
  "Email and password are required": "أدخل البريد الإلكتروني وكلمة المرور.",
  "Invalid email or password": "البريد الإلكتروني أو كلمة المرور غير صحيحة.",
  "Invalid or expired token": "انتهت جلستك. سجّل الدخول من جديد.",
  "Missing or invalid Authorization header": "انتهت جلستك. سجّل الدخول من جديد.",
  "Login failed": "تعذّر تسجيل الدخول. حاول مرة أخرى.",
  "Only the owner can change this": "صاحب الحساب وحده يستطيع تغيير هذا.",
  "Subscription has expired. Please renew to make changes.": "انتهت باقتك. جدّدها لتتمكن من حفظ التعديلات.",
  "Your account has view-only access": "حسابك للمشاهدة فقط، ولا يمكنه إجراء تعديلات.",
  "Too many requests. Please try again later.": "محاولات كثيرة. حاول مرة أخرى بعد قليل.",
  "Too many requests. Please slow down.": "محاولات كثيرة. انتظر قليلاً ثم حاول مجدداً.",
  "Service temporarily unavailable": "الخدمة غير متاحة مؤقتاً. حاول بعد قليل.",
  "Something went wrong. Please try again.": GENERIC,

  // Dishes and categories
  "Category not found": "القسم غير موجود.",
  "Item not found": "الطبق غير موجود.",
  "Not found": "غير موجود.",
  "Category, name, and price are required": "اختر القسم وأدخل اسم الطبق وسعره.",
  "English name is required": "أدخل الاسم بالإنجليزية.",
  "Enter a name in Arabic or English": "أدخل الاسم بالعربية أو بالإنجليزية.",
  "Price must be a number of 0 or more": "يجب أن يكون السعر رقماً يساوي 0 أو أكثر.",
  "Currency must be USD or LBP": "العملة يجب أن تكون الدولار أو الليرة اللبنانية.",
  "Options must be a list": "تعذّر قراءة خيارات الطبق.",
  "Dietary tags must be a list": "تعذّر قراءة الوسوم الغذائية.",
  "Allergens must be a list, or null when not checked": "تعذّر قراءة مسببات الحساسية.",
  "Failed to create category": "تعذّر إضافة القسم. حاول مرة أخرى.",
  "Failed to update category": "تعذّر حفظ القسم. حاول مرة أخرى.",
  "Failed to reorder categories": "تعذّر حفظ ترتيب الأقسام. حاول مرة أخرى.",
  "Failed to create item": "تعذّر إضافة الطبق. حاول مرة أخرى.",
  "Failed to update item": "تعذّر حفظ الطبق. حاول مرة أخرى.",
  "The category list changed. Reload the page and try again.": "تغيّرت قائمة الأقسام. أعد تحميل الصفحة ثم حاول مجدداً.",
  "The dish list changed. Reload the page and try again.": "تغيّرت قائمة الأطباق. أعد تحميل الصفحة ثم حاول مجدداً.",
  "categoryId is required": GENERIC,
  "No fields to update": "لا يوجد ما يُحفظ.",
  "Nothing to change": "لا يوجد ما يُحفظ.",
  "Invalid request body": GENERIC,
  "DB Error": GENERIC,

  // Photos and uploads
  "No file provided": "اختر ملفاً أولاً.",
  "File too large. Maximum size is 2MB": "الملف كبير جداً. الحد الأقصى 2 ميغابايت.",
  "Invalid file type. Allowed: JPEG, PNG, WebP, GIF": "نوع الملف غير مدعوم. استخدم صورة JPEG أو PNG أو WebP أو GIF.",
  "Upload failed": "تعذّر رفع الصورة. حاول مرة أخرى.",
  "Image not found": "الصورة غير موجودة.",
  "Image does not belong to this catalog": "هذه الصورة لا تخص قائمتك.",
  "Failed to delete image": "تعذّر حذف الصورة. حاول مرة أخرى.",
  "URL is required": GENERIC,

  // AI photos
  "AI photos aren't set up on this server yet.": "صور الذكاء الاصطناعي غير مفعّلة بعد.",
  "Add a photo of the dish first, then enhance it.": "أضف صورة للطبق أولاً، ثم حسّنها.",
  "Only photos you uploaded can be enhanced. Upload your own photo of the dish first.": "يمكن تحسين الصور التي رفعتها أنت فقط. ارفع صورتك للطبق أولاً.",
  "We're already working on an image for this dish.": "نعمل حالياً على صورة لهذا الطبق.",
  "You have no AI photo credits left this month.": "لم يتبقَّ لديك رصيد لصور الذكاء الاصطناعي هذا الشهر.",
  "Couldn't start the AI image. Please try again.": "تعذّر بدء إنشاء الصورة. حاول مرة أخرى.",
  "This image request no longer exists.": "طلب الصورة هذا لم يعد موجوداً.",
  "This dish no longer exists.": "هذا الطبق لم يعد موجوداً.",
  "This dish was deleted.": "تم حذف هذا الطبق.",
  "Only a finished image can be used.": "يمكن استخدام الصورة بعد اكتمالها فقط.",
  "Only a finished image can be discarded.": "يمكن تجاهل الصورة بعد اكتمالها فقط.",
  "Only a failed request can be tried again.": "يمكن إعادة المحاولة للطلبات التي تعذّرت فقط.",
  "Only an image in use can be switched back.": "يمكن الرجوع عن الصورة المستخدمة حالياً فقط.",
  "This image was already handled.": "تمت معالجة هذه الصورة من قبل.",
  "This image was already switched back.": "تم الرجوع عن هذه الصورة من قبل.",
  "This request is already running again.": "هذا الطلب قيد التنفيذ من جديد.",
  "The AI service declined this image. Your credit was returned. Try a different photo or style.":
    "رفضت خدمة الذكاء الاصطناعي هذه الصورة، وأُعيد إليك الرصيد. جرّب صورة أو نمطاً مختلفاً.",
  "The AI service couldn't make this image. Your credit was returned. You can try again.":
    "تعذّر على خدمة الذكاء الاصطناعي إنشاء هذه الصورة، وأُعيد إليك الرصيد. يمكنك المحاولة مجدداً.",
  "Unknown kind": GENERIC,
  "Unknown style": GENERIC,
  "Unknown action": GENERIC,
  "Invalid action": GENERIC,
  "itemId and idempotencyKey are required": GENERIC,

  // AI writing and AI waiter
  "AI generation failed. Please try again.": "تعذّر إنشاء النص بالذكاء الاصطناعي. حاول مرة أخرى.",
  "AI service is not configured on this server.": "خدمة الذكاء الاصطناعي غير مفعّلة بعد.",
  "Need existing content to enhance. Write something first or generate with AI.": "اكتب نصاً أولاً ليتم تحسينه، أو أنشئه بالذكاء الاصطناعي.",
  "Please fill in the About content first. AI needs your story to generate optimized SEO.":
    "املأ قسم «من نحن» أولاً، فالذكاء الاصطناعي يحتاج قصتك ليكتب نصوص محركات البحث.",
  "Business name and type are required": "أدخل اسم المطعم ونوعه.",
  "No languages specified": GENERIC,
  "The AI waiter is not available for this menu": "النادل الذكي غير متاح لهذه القائمة.",
  "The AI waiter is not configured on this server": "النادل الذكي غير مفعّل بعد.",
  "Voice messages are not configured on this server": "الرسائل الصوتية غير مفعّلة بعد.",
  "Audio file too large": "الملف الصوتي كبير جداً.",
  "Failed to fetch training queue": "تعذّر تحميل الأسئلة. حاول مرة أخرى.",
  "Failed to process training action": "تعذّر حفظ الإجابة. حاول مرة أخرى.",

  // Settings, hours, FAQs, branches, QR
  "Failed to update settings": "تعذّر حفظ الإعدادات. حاول مرة أخرى.",
  "Colors must be #RRGGBB": "اختر لوناً صالحاً.",
  "Many phones can't read a light code on a dark background. Make the code darker than its background.":
    "كثير من الهواتف لا تقرأ رمزاً فاتحاً على خلفية داكنة. اجعل لون الرمز أغمق من خلفيته.",
  "These colours are too close for phones to scan reliably. Use a darker code colour or a lighter background.":
    "اللونان متقاربان جداً فلا تقرأ الهواتف الرمز بثبات. استخدم لوناً أغمق للرمز أو خلفية أفتح.",
  "Failed to fetch operating hours": "تعذّر تحميل ساعات العمل. حاول مرة أخرى.",
  "Failed to update operating hours": "تعذّر حفظ ساعات العمل. حاول مرة أخرى.",
  "Hours must be a list of up to 7 days": "تعذّر قراءة ساعات العمل.",
  "Failed to fetch FAQs": "تعذّر تحميل الأسئلة الشائعة. حاول مرة أخرى.",
  "Failed to update FAQs": "تعذّر حفظ الأسئلة الشائعة. حاول مرة أخرى.",
  "FAQs must be a list": "تعذّر قراءة الأسئلة الشائعة.",
  "Branch ID required": GENERIC,
  "Failed to create branch": "تعذّر إضافة الفرع. حاول مرة أخرى.",
  "Failed to update branch": "تعذّر حفظ الفرع. حاول مرة أخرى.",
  "Failed to delete branch": "تعذّر حذف الفرع. حاول مرة أخرى.",
  "Failed to fetch branches": "تعذّر تحميل الفروع. حاول مرة أخرى.",
  "Failed to generate QR code": "تعذّر إنشاء رمز QR. حاول مرة أخرى.",

  // Publishing
  "Could not load publishing status": "تعذّر تحميل حالة النشر. حاول مرة أخرى.",
  "Could not publish. Please try again.": "تعذّر النشر. حاول مرة أخرى.",
  "Choose a version to restore": "اختر النسخة التي تريد استعادتها.",
  "Version not found": "النسخة غير موجودة.",
  "Could not restore this version. Nothing was changed.": "تعذّرت استعادة هذه النسخة، ولم يتغيّر شيء.",

  // Team
  "Choose Editor or Viewer": "اختر «محرّر» أو «مشاهد».",
  "Enter the person's name": "أدخل اسم الشخص.",
  "Enter a valid email address": "أدخل بريداً إلكترونياً صحيحاً.",
  "Someone with this email already has access": "صاحب هذا البريد لديه صلاحية وصول مسبقاً.",
  "Could not add this person. Please try again.": "تعذّرت إضافة هذا الشخص. حاول مرة أخرى.",
  "Team member not found": "عضو الفريق غير موجود.",
  "The owner can't be removed": "لا يمكن إزالة صاحب الحساب.",
  "The owner's access can't be changed here": "لا يمكن تغيير صلاحيات صاحب الحساب من هنا.",
  "Email not configured": "إرسال البريد غير مفعّل بعد.",

  // Billing
  "Upgrade request submitted successfully.": "تم إرسال طلبك. سنتواصل معك قريباً.",
  "You already have a pending upgrade request.": "لديك طلب قيد المراجعة بالفعل.",
  "Failed to submit request": "تعذّر إرسال الطلب. حاول مرة أخرى.",
  "Missing plan name": "اختر باقة.",
  "Unknown plan": "اختر باقة.",

  // Menu import
  "Nothing to import": "لا يوجد ما يُستورد.",
  "Could not import. Nothing was added. Please try again.": "تعذّر الاستيراد، ولم تُضف أي أطباق. حاول مرة أخرى.",
  "Reading menus with AI isn't set up on this server yet.": "قراءة القوائم بالذكاء الاصطناعي غير مفعّلة بعد.",
  "Choose a photo or PDF of your menu": "اختر صورة أو ملف PDF لقائمتك.",
  "These files are too large. Use up to 5 photos or one PDF, 9 MB in total.": "الملفات كبيرة جداً. استخدم حتى 5 صور أو ملف PDF واحداً، بحجم 9 ميغابايت كحد أقصى.",
  "Use photos (JPEG, PNG, WebP or HEIC) or a PDF.": "استخدم صوراً (JPEG أو PNG أو WebP أو HEIC) أو ملف PDF.",
  "We couldn't read this menu. Try again with a clearer photo, or use a spreadsheet.": "تعذّرت قراءة هذه القائمة. جرّب صورة أوضح، أو استخدم جدولاً.",
  "We couldn't find any dishes in these files. Try a clearer photo, or use a spreadsheet.": "لم نجد أطباقاً في هذه الملفات. جرّب صورة أوضح، أو استخدم جدولاً.",
};

const DAYS_AR: Record<string, string> = {
  Monday: "الاثنين",
  Tuesday: "الثلاثاء",
  Wednesday: "الأربعاء",
  Thursday: "الخميس",
  Friday: "الجمعة",
  Saturday: "السبت",
  Sunday: "الأحد",
};
const day = (name: string) => DAYS_AR[name] ?? name;

/** Messages with numbers or names in them */
const PATTERNS: [RegExp, (...groups: string[]) => string][] = [
  [/^Item limit reached for your plan \((\d+)\)\. Upgrade to add more\.$/, (n) => `وصلت إلى الحد الأقصى للأطباق في باقتك (${n}). رقِّ باقتك لإضافة المزيد.`],
  [/^Category limit reached for your plan \((\d+)\)\. Upgrade to add more\.$/, (n) => `وصلت إلى الحد الأقصى للأقسام في باقتك (${n}). رقِّ باقتك لإضافة المزيد.`],
  [/^Image limit reached\. Maximum (\d+) images per catalog\.$/, (n) => `وصلت إلى الحد الأقصى للصور (${n} صورة).`],
  [/^Option (\d+) needs a name$/, (n) => `الخيار ${n} يحتاج إلى اسم.`],
  [/^Option (\d+) needs a price of 0 or more$/, (n) => `الخيار ${n} يحتاج إلى سعر يساوي 0 أو أكثر.`],
  [/^A dish can have at most (\d+) options$/, (n) => `يمكن أن يكون للطبق ${n} خيارات كحد أقصى.`],
  [/^A menu can have up to (\d+) team members$/, (n) => `يمكن أن يضم الفريق ${n} أعضاء كحد أقصى.`],
  [/^At most (\d+) FAQs are allowed$/, (n) => `الحد الأقصى ${n} سؤالاً.`],
  [/^FAQ (\d+) needs a question and an answer in at least one language$/, (n) => `السؤال ${n} يحتاج إلى سؤال وجواب بلغة واحدة على الأقل.`],
  [/^(\w+) is listed twice$/, (d) => `يوم ${day(d)} مكرّر.`],
  [/^(\w+) needs opening and closing hours between 0 and 24$/, (d) => `يوم ${day(d)} يحتاج إلى ساعة فتح وساعة إغلاق صحيحتين.`],
  [/^Unknown day "/, () => "يوم غير معروف في ساعات العمل."],
  [/^Category (\d+) needs a name in Arabic or English$/, (n) => `القسم ${n} يحتاج إلى اسم بالعربية أو بالإنجليزية.`],
  [/^Dish (\d+) needs a name in Arabic or English$/, (n) => `الطبق ${n} يحتاج إلى اسم بالعربية أو بالإنجليزية.`],
  [/^Dish (\d+) needs a price of 0 or more$/, (n) => `الطبق ${n} يحتاج إلى سعر يساوي 0 أو أكثر.`],
  [/^Dish (\d+): (.+)$/, (n, rest) => `الطبق ${n}: ${translateApiMessage(rest, "ar")}`],
  [/^At most (\d+) dishes can be imported at once$/, (n) => `يمكن استيراد ${n} طبق كحد أقصى في المرة الواحدة.`],
  [
    /^This import would go over your plan's limit of (\d+) dishes\. You have (\d+) and are adding (\d+)\.$/,
    (max, have, adding) => `هذا الاستيراد يتجاوز حدّ باقتك وهو ${max} طبق. لديك ${have} وتضيف ${adding}.`,
  ],
  [
    /^This import would go over your plan's limit of (\d+) categories\. You have (\d+) and are adding (\d+)\.$/,
    (max, have, adding) => `هذا الاستيراد يتجاوز حدّ باقتك وهو ${max} قسماً. لديك ${have} وتضيف ${adding}.`,
  ],
];

/**
 * The Arabic for an API message (English stays as it is). An unknown error becomes a general
 * Arabic error; with `fallback: false` (e.g. a success message) an unknown text is kept.
 */
export function translateApiMessage(message: string, lang: AdminLang, { fallback = true }: { fallback?: boolean } = {}): string {
  if (lang !== "ar") return message;
  const text = message.trim();
  const exact = EXACT[text];
  if (exact) return exact;
  for (const [pattern, render] of PATTERNS) {
    const match = text.match(pattern);
    if (match) return render(...match.slice(1));
  }
  // Already Arabic (e.g. a message written by the owner) stays as it is
  if (!fallback || /[؀-ۿ]/.test(text)) return message;
  return GENERIC;
}

export const API_MESSAGE_EXACT = EXACT;
export const API_MESSAGE_PATTERNS = PATTERNS.map(([pattern]) => pattern);
