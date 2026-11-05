// Arabic for the error messages the dashboard's APIs send. The APIs answer in English; the
// dashboard's fetch helper (CatalogAdminShell's fetchWithAuth) runs every `error` and `message`
// through translateApiMessage when the dashboard is in Arabic. A message without a translation
// falls back to a general Arabic one rather than showing English.
// scratchpad check: every error string in src/app/api/c, src/app/api/ai and lib must match here.

import type { AdminLang } from "./i18n";

const GENERIC = "حدث خطأ. يُرجى المحاولة مرة أخرى.";

const EXACT: Record<string, string> = {
  // Access and accounts
  "Access denied to this catalog": "ليس لديك صلاحية الوصول إلى هذه الصفحة.",
  "Account is deactivated": "تم إيقاف هذا الحساب.",
  "Admin not found": "الحساب غير موجود.",
  "User not found": "الحساب غير موجود.",
  "Super admin not found": "الحساب غير موجود.",
  "Catalog is suspended or inactive": "هذه الصفحة موقوفة حالياً.",
  "Catalog is suspended": "هذه الصفحة موقوفة حالياً.",
  "Catalog not found": "الصفحة غير موجودة.",
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

  // Orders
  "Order not found": "الطلب غير موجود.",
  "Stock must be a whole number of 0 or more": "المخزون يجب أن يكون عدداً صحيحاً يساوي 0 أو أكثر.",
  "The old price must be a number of 0 or more": "السعر القديم يجب أن يكون رقماً يساوي 0 أو أكثر.",
  "Duration must be between 5 minutes and 24 hours": "المدة يجب أن تكون بين 5 دقائق و24 ساعة.",
  // Sent to customers (the page shows its own words by code); listed so nothing shows in English
  "This page is not taking orders": "هذه الصفحة لا تستقبل طلبات حالياً.",
  "Not enough stock for an item": "الكمية المتوفرة من أحد الأصناف غير كافية.",
  "This time was just booked": "حُجز هذا الوقت للتو. اختر وقتاً آخر.",
  "This code can't be used": "لا يمكن استخدام هذا الرمز.",
  "This code already exists": "هذا الرمز موجود مسبقاً.",
  "Up to 100 codes": "100 رمز كحدّ أقصى.",
  "Coupon not found": "لم يُعثر على رمز الخصم.",
  "Add a reward to turn on the loyalty card": "أضف مكافأة لتفعيل بطاقة الولاء.",
  "A code needs 3 to 20 letters or numbers": "يحتاج الرمز إلى 3 حتى 20 حرفاً أو رقماً.",
  "Enter a percentage from 1 to 100": "أدخل نسبة من 1 إلى 100.",
  "Enter the amount off": "أدخل قيمة الخصم.",
  "Enter a valid minimum order": "أدخل حداً أدنى صحيحاً للطلب.",
  "The end date is before the start date": "تاريخ الانتهاء قبل تاريخ البدء.",
  "Enter a valid number of uses": "أدخل عدد استخدامات صحيحاً.",
  "Not enough stock left to reopen this order": "لم يبقَ في المخزون ما يكفي لإعادة فتح هذا الطلب.",
  "Notifications are not set up on this server": "الإشعارات غير مفعّلة على الخادم بعد.",
  "This browser's notification details aren't valid": "تفاصيل الإشعارات في هذا المتصفح غير صالحة.",
  "Unknown order status": GENERIC,
  "This order can't be changed to that status": "لا يمكن نقل هذا الطلب إلى هذه الحالة. أعد تحميل الصفحة.",
  "Invalid request": GENERIC,
  "Unknown module": GENERIC,
  "Add-ons must be a list": GENERIC,

  // Dishes and categories
  "Category not found": "القسم غير موجود.",
  "Item not found": "الصنف غير موجود.",
  "Not found": "غير موجود.",
  "Category, name, and price are required": "اختر القسم وأدخل اسم الصنف وسعره.",
  "English name is required": "أدخل الاسم بالإنجليزية.",
  "Enter a name in Arabic or English": "أدخل الاسم بالعربية أو بالإنجليزية.",
  "Price must be a number of 0 or more": "يجب أن يكون السعر رقماً يساوي 0 أو أكثر.",
  "Currency must be USD or LBP": "العملة يجب أن تكون الدولار أو الليرة اللبنانية.",
  "Options must be a list": "تعذّر قراءة خيارات الصنف.",
  "Dietary tags must be a list": "تعذّر قراءة الوسوم الغذائية.",
  "Allergens must be a list, or null when not checked": "تعذّر قراءة مسببات الحساسية.",
  "Failed to create category": "تعذّر إضافة القسم. حاول مرة أخرى.",
  "Failed to update category": "تعذّر حفظ القسم. حاول مرة أخرى.",
  "Failed to reorder categories": "تعذّر حفظ ترتيب الأقسام. حاول مرة أخرى.",
  "Failed to create item": "تعذّر إضافة الصنف. حاول مرة أخرى.",
  "Failed to update item": "تعذّر حفظ الصنف. حاول مرة أخرى.",
  "The category list changed. Reload the page and try again.": "تغيّرت قائمة الأقسام. أعد تحميل الصفحة ثم حاول مجدداً.",
  "The item list changed. Reload the page and try again.": "تغيّرت قائمة الأصناف. أعد تحميل الصفحة ثم حاول مجدداً.",
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
  "Image does not belong to this catalog": "هذه الصورة لا تخص صفحتك.",
  "Failed to delete image": "تعذّر حذف الصورة. حاول مرة أخرى.",
  "URL is required": GENERIC,

  // AI photos
  "AI photos aren't set up on this server yet.": "صور الذكاء الاصطناعي غير مفعّلة بعد.",
  "Add a photo of the item first, then enhance it.": "أضف صورة للصنف أولاً، ثم حسّنها.",
  "Only photos you uploaded can be enhanced. Upload your own photo of the item first.": "يمكن تحسين الصور التي رفعتها أنت فقط. ارفع صورتك للصنف أولاً.",
  "We're already working on an image for this item.": "نعمل حالياً على صورة لهذا الصنف.",
  "You have no AI photo credits left this month.": "لم يتبقَّ لديك رصيد لصور الذكاء الاصطناعي هذا الشهر.",
  "Couldn't start the AI image. Please try again.": "تعذّر بدء إنشاء الصورة. حاول مرة أخرى.",
  "This image request no longer exists.": "طلب الصورة هذا لم يعد موجوداً.",
  "This item no longer exists.": "هذا الصنف لم يعد موجوداً.",
  "This item was deleted.": "تم حذف هذا الصنف.",
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
  "Business name and type are required": "أدخل اسم النشاط ونوعه.",
  "No languages specified": GENERIC,
  "The AI assistant is not available for this page": "المساعد الذكي غير متاح لهذه الصفحة.",
  "The AI assistant is not configured on this server": "المساعد الذكي غير مفعّل بعد.",
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
  "Choose a photo or PDF of your menu or price list": "اختر صورة أو ملف PDF لقائمتك أو لائحة أسعارك.",
  "These files are too large. Use up to 5 photos or one PDF, 9 MB in total.": "الملفات كبيرة جداً. استخدم حتى 5 صور أو ملف PDF واحداً، بحجم 9 ميغابايت كحد أقصى.",
  "Use photos (JPEG, PNG, WebP or HEIC) or a PDF.": "استخدم صوراً (JPEG أو PNG أو WebP أو HEIC) أو ملف PDF.",
  "We couldn't read this list. Try again with a clearer photo, or use a spreadsheet.": "تعذّرت قراءة هذه اللائحة. جرّب صورة أوضح، أو استخدم جدولاً.",
  "We couldn't find any items in these files. Try a clearer photo, or use a spreadsheet.": "لم نجد أصنافاً في هذه الملفات. جرّب صورة أوضح، أو استخدم جدولاً.",
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
  [/^An item can have at most (\d+) options$/, (n) => `يمكن أن يكون للصنف ${n} خيارات كحد أقصى.`],
  [/^A page can have up to (\d+) team members$/, (n) => `يمكن أن يضم الفريق ${n} أعضاء كحد أقصى.`],
  [/^At most (\d+) FAQs are allowed$/, (n) => `الحد الأقصى ${n} سؤالاً.`],
  [/^FAQ (\d+) needs a question and an answer in at least one language$/, (n) => `السؤال ${n} يحتاج إلى سؤال وجواب بلغة واحدة على الأقل.`],
  [/^(\w+) is listed twice$/, (d) => `يوم ${day(d)} مكرّر.`],
  [/^(\w+) needs opening and closing hours between 0 and 24$/, (d) => `يوم ${day(d)} يحتاج إلى ساعة فتح وساعة إغلاق صحيحتين.`],
  [/^Unknown day "/, () => "يوم غير معروف في ساعات العمل."],
  [/^Category (\d+) needs a name in Arabic or English$/, (n) => `القسم ${n} يحتاج إلى اسم بالعربية أو بالإنجليزية.`],
  [/^Item (\d+) needs a name in Arabic or English$/, (n) => `الصنف ${n} يحتاج إلى اسم بالعربية أو بالإنجليزية.`],
  [/^Item (\d+) needs a price of 0 or more$/, (n) => `الصنف ${n} يحتاج إلى سعر يساوي 0 أو أكثر.`],
  [/^Item (\d+): (.+)$/, (n, rest) => `الصنف ${n}: ${translateApiMessage(rest, "ar")}`],
  [/^At most (\d+) items can be imported at once$/, (n) => `يمكن استيراد ${n} صنف كحد أقصى في المرة الواحدة.`],
  [
    /^This import would go over your plan's limit of (\d+) items\. You have (\d+) and are adding (\d+)\.$/,
    (max, have, adding) => `هذا الاستيراد يتجاوز حدّ باقتك وهو ${max} صنف. لديك ${have} وتضيف ${adding}.`,
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
