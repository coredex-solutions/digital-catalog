// Marketing site copy in English and Arabic. Every claim here must match what the product
// actually does (MENUDESIGN.md: no fake functionality, metrics or testimonials). Plan prices
// and limits must match lib/plans.ts.

export type SiteLang = "en" | "ar";

export const SALES_WHATSAPP = "966540679669";
export const SALES_EMAIL = "ops@coredex.solutions";
export const DEMO_PATH = "/c/demo";
export const SITE_LANG_COOKIE = "site_lang";

const en = {
  metaTitle: "Coredex: QR menus for restaurants and cafés",
  metaDescription:
    "A fast QR menu guests open in the browser, in Arabic and English, with prices in dollars and Lebanese pounds and orders sent to your WhatsApp.",
  nav: { features: "Features", pricing: "Pricing", demo: "Live demo", faq: "Questions", start: "Start free trial", language: "العربية" },
  hero: {
    eyebrow: "QR menus for restaurants and cafés",
    title: "Your menu on every table, in Arabic and English",
    body: "Guests scan and the menu opens in their browser. No app to install. Prices show in dollars and Lebanese pounds, and orders come straight to your WhatsApp.",
    primary: "Start a 2-day free trial",
    secondary: "Open the live demo",
    note: "No card needed. The demo is a real menu you can try.",
    noteNoDemo: "No card needed.",
  },
  preview: { label: "Live demo menu", sample: "Sample menu", open: "Open full screen" },
  heroTitle: {
    lead: "Your menu on every table,",
    rotating: ["in Arabic", "in English", "in dollars and pounds"],
    full: "Your menu on every table, in Arabic and English, in dollars and pounds",
  },
  floats: {
    orderTitle: "New order · Table 7",
    orderBody: "2 × Hummus · 1 × Fattoush",
    priceLabel: "Hummus",
    scan: "Scan to open",
    lang: "عربي · EN",
  },
  marquee: { label: "Sample dishes, as guests see them" },
  dishes: { hummus: "Hummus", kibbeh: "Fried kibbeh", babaGanoush: "Baba ghanoush", mansaf: "Lamb mansaf" },
  currency: {
    eyebrow: "Dual pricing",
    title: "Dollars and pounds, at your rate",
    body: "Enter prices once. Set your exchange rate and choose which currency comes first; every price on the menu updates together.",
    rate: "Your exchange rate",
    perDollar: "L.L. per $1",
    first: "Show first",
    usd: "Dollars",
    lbp: "Pounds",
    note: "Try it: drag the rate. Pounds are rounded to the nearest 1,000 L.L.",
    items: [
      { name: "Hummus", price: 4 },
      { name: "Fattoush", price: 5 },
      { name: "Mixed grill", price: 14 },
    ],
  },
  language: {
    eyebrow: "Bilingual by default",
    title: "One tap between Arabic and English",
    body: "Write each dish in the languages you serve. Guests switch instantly, and the whole menu turns right to left in Arabic.",
    switchTo: "عرض بالعربية",
    switchBack: "Show in English",
  },
  whatsappDemo: {
    eyebrow: "Orders on WhatsApp",
    title: "Orders arrive ready to read",
    body: "Guests pick dine-in, takeaway or delivery. You get one clear message with the table or address, every item, notes and the total in both currencies.",
    chatName: "Your restaurant",
    note: "This is the exact message format guests send.",
    sampleName: "Rami",
    samplePhone: "71 123 456",
    restaurant: "Your restaurant",
  },
  cta: {
    title: "Put your menu on the table this week",
    body: "Start the 2-day free trial, add your dishes and print your QR code. We can help you get set up on WhatsApp.",
    primary: "Start free trial",
    secondary: "Talk to us on WhatsApp",
  },
  guests: {
    title: "What your guests get",
    items: [
      { title: "Opens from the camera", body: "Scanning the QR code opens the menu in the browser. Nothing to download, no account." },
      { title: "Arabic and English", body: "Guests switch language in one tap. Arabic reads right to left, as it should." },
      { title: "Dollars and pounds side by side", body: "You set the exchange rate. The menu shows when you last changed it and never guesses one." },
      { title: "Orders on WhatsApp", body: "Dine-in, takeaway or delivery. The order arrives in your WhatsApp with items, notes and total." },
      { title: "Search that understands Arabic", body: "Finds “منقوشة” even when typed “منقوشه”, with or without diacritics." },
      { title: "Hours and sold-out dishes", body: "Guests see if you're open now, and sold-out dishes are labelled instead of disappearing." },
    ],
  },
  owners: {
    title: "What you manage",
    items: [
      { title: "Dishes, prices and photos", body: "Add categories and dishes with descriptions in each language. Changes show on the menu right away." },
      { title: "One-tap sold out", body: "Mark a dish sold out from the dishes list without opening a form." },
      { title: "Your colours and logo", body: "Your brand colour, logo and cover photo, adjusted automatically so text stays readable." },
      { title: "QR codes to print", body: "Download your menu's QR code. The link never changes, so printed codes keep working." },
      { title: "AI photo enhancement", body: "Improve the lighting of your own dish photos. A monthly allowance comes with each plan." },
      { title: "Visits and order clicks", body: "See menu visits and how many guests tapped to order on WhatsApp." },
    ],
  },
  steps: {
    title: "Set up in three steps",
    items: [
      { title: "Create your account", body: "Pick a web address for your menu and verify your email." },
      { title: "Add your menu", body: "Categories, dishes, prices, photos, hours and your WhatsApp number." },
      { title: "Print the QR code", body: "Put it on tables, the counter or the door. Guests scan and order." },
    ],
  },
  pricing: {
    title: "Simple yearly plans",
    body: "Every plan starts with a 2-day free trial. To upgrade, request a plan from your dashboard and our team activates it.",
    perYear: "/ year",
    choose: "Start free trial",
    popular: "Most complete for one venue",
    plans: [
      {
        id: "essential",
        name: "Essential",
        price: "$99",
        summary: "For a small menu in one language.",
        features: ["Up to 200 dishes", "Up to 20 categories", "Arabic and English menu", "WhatsApp orders and bookings", "Dollar and pound prices", "5 AI photo enhancements a month", "QR code and analytics"],
      },
      {
        id: "pro",
        name: "Pro",
        price: "$299",
        summary: "For bilingual menus with more dishes.",
        features: ["Up to 1,000 dishes", "Up to 50 categories", "Everything in Essential", "20 AI photo enhancements a month"],
      },
      {
        id: "enterprise",
        name: "Enterprise",
        price: "$399",
        summary: "For large menus and groups.",
        features: ["Up to 10,000 dishes", "Up to 200 categories", "Everything in Pro", "100 AI photo enhancements a month"],
      },
    ],
  },
  faq: {
    title: "Questions",
    items: [
      { q: "Do guests need to install an app?", a: "No. The menu opens in the phone's browser from the QR code or a short link." },
      { q: "Can I show prices in Lebanese pounds?", a: "Yes. Enter your rate and the menu shows both currencies, rounded to the nearest 1,000 L.L. Change the rate whenever you need to." },
      { q: "Do guests pay through the menu?", a: "No. Orders are sent to your WhatsApp and guests pay at the restaurant or on delivery, as you do today." },
      { q: "What happens when I edit the menu?", a: "Changes appear on the menu immediately. The QR code and link stay the same." },
      { q: "What if my subscription ends?", a: "The public menu is paused until you renew. Your dishes and settings are kept." },
    ],
  },
  contact: {
    title: "Talk to us",
    body: "Questions, a demo for your team, or help adding your menu. Message us on WhatsApp or by email.",
    whatsapp: "Message on WhatsApp",
    email: "Send an email",
  },
  footer: { rights: "© 2026 Coredex Solutions", demo: "Live demo", signup: "Start free trial", privacy: "Privacy", terms: "Terms" },
};

type SiteCopy = typeof en;

const ar: SiteCopy = {
  metaTitle: "Coredex: قوائم طعام QR للمطاعم والمقاهي",
  metaDescription:
    "قائمة طعام سريعة يفتحها الزبائن في المتصفح، بالعربية والإنجليزية، مع الأسعار بالدولار والليرة اللبنانية والطلبات مباشرة إلى واتساب.",
  nav: { features: "المزايا", pricing: "الأسعار", demo: "تجربة حيّة", faq: "أسئلة", start: "ابدأ التجربة المجانية", language: "English" },
  hero: {
    eyebrow: "قوائم QR للمطاعم والمقاهي",
    title: "قائمتك على كل طاولة، بالعربية والإنجليزية",
    body: "يمسح الزبون الرمز فتفتح القائمة في متصفحه، من دون أي تطبيق. الأسعار بالدولار والليرة، والطلبات تصلك مباشرة على واتساب.",
    primary: "ابدأ تجربة مجانية ليومين",
    secondary: "افتح التجربة الحيّة",
    note: "لا حاجة لبطاقة دفع. التجربة قائمة حقيقية يمكنك استخدامها.",
    noteNoDemo: "لا حاجة لبطاقة دفع.",
  },
  preview: { label: "قائمة تجريبية حيّة", sample: "قائمة نموذجية", open: "افتحها بملء الشاشة" },
  heroTitle: {
    lead: "قائمتك على كل طاولة،",
    rotating: ["بالعربية", "بالإنجليزية", "بالدولار والليرة"],
    full: "قائمتك على كل طاولة، بالعربية والإنجليزية، بالدولار والليرة",
  },
  floats: {
    orderTitle: "طلب جديد · طاولة 7",
    orderBody: "2 × حمص · 1 × فتوش",
    priceLabel: "حمص",
    scan: "امسح لتفتح",
    lang: "عربي · EN",
  },
  marquee: { label: "أطباق تجريبية كما يراها الزبائن" },
  dishes: { hummus: "حمص", kibbeh: "كبة مقلية", babaGanoush: "بابا غنوج", mansaf: "منسف لحم" },
  currency: {
    eyebrow: "سعران معاً",
    title: "الدولار والليرة، على سعر صرفك",
    body: "أدخل الأسعار مرة واحدة. حدّد سعر الصرف واختر العملة الأولى، فتتحدّث كل أسعار القائمة معاً.",
    rate: "سعر الصرف",
    perDollar: "ل.ل. للدولار",
    first: "العملة الأولى",
    usd: "الدولار",
    lbp: "الليرة",
    note: "جرّب: حرّك سعر الصرف. تُقرَّب الليرة إلى أقرب 1,000 ل.ل.",
    items: [
      { name: "حمص", price: 4 },
      { name: "فتوش", price: 5 },
      { name: "مشاوي مشكّلة", price: 14 },
    ],
  },
  language: {
    eyebrow: "بلغتين من البداية",
    title: "لمسة واحدة بين العربية والإنجليزية",
    body: "اكتب كل طبق باللغات التي تخدم بها. يبدّل الزبون فوراً، وتنقلب القائمة كلها من اليمين إلى اليسار بالعربية.",
    switchTo: "Show in English",
    switchBack: "عرض بالعربية",
  },
  whatsappDemo: {
    eyebrow: "الطلبات على واتساب",
    title: "طلبات تصلك واضحة وجاهزة",
    body: "يختار الزبون داخل المطعم أو سفري أو توصيل. تصلك رسالة واحدة واضحة فيها الطاولة أو العنوان، وكل الأصناف والملاحظات، والمجموع بالعملتين.",
    chatName: "مطعمك",
    note: "هذا هو شكل الرسالة الذي يرسله الزبائن فعلاً.",
    sampleName: "رامي",
    samplePhone: "71 123 456",
    restaurant: "مطعمك",
  },
  cta: {
    title: "ضع قائمتك على الطاولة هذا الأسبوع",
    body: "ابدأ التجربة المجانية ليومين، أضف أطباقك واطبع رمز QR. يمكننا مساعدتك في الإعداد عبر واتساب.",
    primary: "ابدأ التجربة المجانية",
    secondary: "تواصل معنا على واتساب",
  },
  guests: {
    title: "ما يحصل عليه زبائنك",
    items: [
      { title: "تفتح من الكاميرا", body: "مسح رمز QR يفتح القائمة في المتصفح. لا تحميل ولا حساب." },
      { title: "عربي وإنجليزي", body: "يغيّر الزبون اللغة بلمسة واحدة، والعربية تُعرض من اليمين إلى اليسار كما يجب." },
      { title: "الدولار والليرة جنباً إلى جنب", body: "أنت تحدد سعر الصرف، والقائمة تُظهر تاريخ آخر تعديل ولا تفترض أي سعر." },
      { title: "الطلبات على واتساب", body: "داخل المطعم أو سفري أو توصيل. يصلك الطلب على واتساب مع الأصناف والملاحظات والمجموع." },
      { title: "بحث يفهم العربية", body: "يجد «منقوشة» حتى لو كُتبت «منقوشه»، مع التشكيل أو من دونه." },
      { title: "ساعات العمل والأصناف النافدة", body: "يرى الزبون إن كنت مفتوحاً الآن، والأطباق النافدة تظهر عليها علامة بدل أن تختفي." },
    ],
  },
  owners: {
    title: "ما تديره أنت",
    items: [
      { title: "الأطباق والأسعار والصور", body: "أضف الأقسام والأطباق مع الوصف بكل لغة. التعديلات تظهر على القائمة فوراً." },
      { title: "«نفدت الكمية» بلمسة", body: "علّم الطبق كنافد من قائمة الأطباق من دون فتح أي نموذج." },
      { title: "ألوانك وشعارك", body: "لون علامتك وشعارك وصورة الغلاف، مع ضبط تلقائي لتبقى النصوص واضحة." },
      { title: "رموز QR للطباعة", body: "حمّل رمز QR لقائمتك. الرابط لا يتغير، فتبقى الرموز المطبوعة صالحة." },
      { title: "تحسين الصور بالذكاء الاصطناعي", body: "حسّن إضاءة صور أطباقك الحقيقية، مع رصيد شهري ضمن كل باقة." },
      { title: "الزيارات ونقرات الطلب", body: "تابع زيارات القائمة وعدد الزبائن الذين ضغطوا للطلب عبر واتساب." },
    ],
  },
  steps: {
    title: "التشغيل في ثلاث خطوات",
    items: [
      { title: "أنشئ حسابك", body: "اختر رابطاً لقائمتك وأكّد بريدك الإلكتروني." },
      { title: "أضف قائمتك", body: "الأقسام والأطباق والأسعار والصور وساعات العمل ورقم واتساب." },
      { title: "اطبع رمز QR", body: "ضعه على الطاولات أو عند الصندوق أو على الباب. يمسح الزبون ويطلب." },
    ],
  },
  pricing: {
    title: "باقات سنوية بسيطة",
    body: "كل باقة تبدأ بتجربة مجانية ليومين. للترقية، اطلب الباقة من لوحة التحكم ويفعّلها فريقنا.",
    perYear: "/ سنوياً",
    choose: "ابدأ التجربة المجانية",
    popular: "الأكمل لمطعم واحد",
    plans: [
      {
        id: "essential",
        name: "Essential",
        price: "$99",
        summary: "لقائمة صغيرة بلغة واحدة.",
        features: ["حتى 200 طبق", "حتى 20 قسماً", "قائمة بالعربية والإنجليزية", "طلبات وحجوزات عبر واتساب", "أسعار بالدولار والليرة", "5 تحسينات صور شهرياً", "رمز QR وإحصاءات"],
      },
      {
        id: "pro",
        name: "Pro",
        price: "$299",
        summary: "لقوائم بلغتين وأطباق أكثر.",
        features: ["حتى 1,000 طبق", "حتى 50 قسماً", "كل ما في Essential", "20 تحسين صور شهرياً"],
      },
      {
        id: "enterprise",
        name: "Enterprise",
        price: "$399",
        summary: "للقوائم الكبيرة والمجموعات.",
        features: ["حتى 10,000 طبق", "حتى 200 قسم", "كل ما في Pro", "100 تحسين صور شهرياً"],
      },
    ],
  },
  faq: {
    title: "أسئلة",
    items: [
      { q: "هل يحتاج الزبائن إلى تثبيت تطبيق؟", a: "لا. تفتح القائمة في متصفح الهاتف من رمز QR أو رابط قصير." },
      { q: "هل يمكنني عرض الأسعار بالليرة اللبنانية؟", a: "نعم. أدخل سعر الصرف فتعرض القائمة العملتين، مع تقريب الليرة إلى أقرب 1,000 ل.ل. ويمكنك تغيير السعر متى شئت." },
      { q: "هل يدفع الزبائن عبر القائمة؟", a: "لا. تُرسل الطلبات إلى واتساب، والدفع في المطعم أو عند التوصيل كما تفعل اليوم." },
      { q: "ماذا يحدث عندما أعدّل القائمة؟", a: "تظهر التعديلات على القائمة فوراً، ويبقى رمز QR والرابط كما هما." },
      { q: "ماذا لو انتهى اشتراكي؟", a: "تتوقف القائمة العامة مؤقتاً حتى التجديد، وتبقى أطباقك وإعداداتك محفوظة." },
    ],
  },
  contact: {
    title: "تواصل معنا",
    body: "أسئلة، أو عرض لفريقك، أو مساعدة في إدخال قائمتك. راسلنا على واتساب أو عبر البريد الإلكتروني.",
    whatsapp: "راسلنا على واتساب",
    email: "أرسل بريداً إلكترونياً",
  },
  footer: { rights: "© 2026 Coredex Solutions", demo: "تجربة حيّة", signup: "ابدأ التجربة المجانية", privacy: "الخصوصية", terms: "الشروط" },
};

export type { SiteCopy };

export function getSiteCopy(lang: SiteLang): SiteCopy {
  return lang === "ar" ? ar : en;
}
