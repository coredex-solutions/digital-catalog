// Marketing site copy in English and Arabic. Every claim here must match what the product
// actually does (MENUDESIGN.md: no fake functionality, metrics or testimonials). Plan prices
// and limits must match lib/plans.ts.

export type SiteLang = "en" | "ar";

export { SALES_WHATSAPP, SALES_EMAIL } from "@/lib/contact";
export const DEMO_PATH = "/c/demo/";
export const SITE_LANG_COOKIE = "site_lang";

const en = {
  metaTitle: "Coredex: online menus, stores and service pages in Arabic and English",
  metaDescription:
    "Your menu, store or services page, opened from a QR code or a link. Arabic and English, prices in dollars and Lebanese pounds, and every order saved and sent to your WhatsApp.",
  nav: { modules: "Who it's for", features: "Features", pricing: "Pricing", demo: "Live demo", faq: "Questions", start: "Start free trial", login: "Log in", language: "العربية" },
  hero: {
    eyebrow: "For restaurants, cafés, shops and services",
    title: "Your menu, store or services page, in Arabic and English",
    body: "Customers open it from a QR code or a link, with no app to install. Prices show in dollars and Lebanese pounds, and every order is saved in your dashboard and sent to your WhatsApp.",
    primary: "Start a 2-day free trial",
    secondary: "Open the live demo",
    note: "No card needed. The demo is a real menu you can try.",
    noteNoDemo: "No card needed.",
  },
  preview: { label: "Live demo menu", sample: "Sample menu", open: "Open full screen" },
  heroTitle: {
    lead: "Your business online,",
    rotating: ["in Arabic", "in English", "in dollars and pounds"],
    full: "Your business online, in Arabic and English, in dollars and pounds",
  },
  modules: {
    eyebrow: "One platform, four kinds of business",
    title: "Pick your business. Get a page made for it.",
    body: "Choose your type when you sign up. The words, the layout and how customers order follow it, and you can switch on extras later.",
    start: "Start free trial",
    startAs: (label: string) => `Start a free trial as: ${label}`,
    demo: "See a demo",
    demoOf: (label: string) => `See a demo: ${label}`,
    points: {
      restaurant: ["Menu with dish photos, options and allergens", "Dine-in with table QR codes, takeaway and delivery", "Table booking requests"],
      cafe: ["Photo grid of drinks, sweets and baked goods", "Pickup with a ready time, and pre-orders for a date", "Sizes and options, like milk or sugar"],
      shop: ["Product grid with sizes, colours and sale prices", "Stock that sells out by itself at zero", "Delivery and pickup orders"],
      services: ["Services with prices and how long each takes", "Appointment requests with a preferred date and time", "At your place or a home visit"],
    } as Record<string, string[]>,
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
    body: "Write each item in the languages you serve. Customers switch instantly, and the whole page turns right to left in Arabic.",
    switchTo: "عرض بالعربية",
    switchBack: "Show in English",
  },
  whatsappDemo: {
    eyebrow: "Saved orders, on WhatsApp too",
    title: "Orders arrive ready to read",
    body: "Each order is saved on your Orders page with a number. It also arrives on WhatsApp as one clear message with the table or address, every item, notes and the total in both currencies.",
    chatName: "Your restaurant",
    note: "This is the exact message format guests send.",
    sampleName: "Rami",
    samplePhone: "71 123 456",
    restaurant: "Your restaurant",
  },
  cta: {
    title: "Put your business online this week",
    body: "Start the 2-day free trial, add your items and share your link or QR code. We can help you get set up on WhatsApp.",
    primary: "Start free trial",
    secondary: "Talk to us on WhatsApp",
  },
  guests: {
    title: "What your customers get",
    items: [
      { title: "Opens from the camera", body: "Scanning the QR code or tapping your link opens the page in the browser. Nothing to download, no account." },
      { title: "Arabic and English", body: "Customers switch language in one tap. Arabic reads right to left, as it should." },
      { title: "Dollars and pounds side by side", body: "You set the exchange rate. The page shows when you last changed it and never guesses one." },
      { title: "Ordering that fits", body: "Dine-in, takeaway, delivery, pickup or an appointment: each business offers its own. Every order is saved and sent on WhatsApp." },
      { title: "Search that understands Arabic", body: "Finds “منقوشة” even when typed “منقوشه”, with or without diacritics." },
      { title: "Hours and sold-out items", body: "Customers see if you're open now, and sold-out items are labelled instead of disappearing." },
    ],
  },
  owners: {
    title: "What you manage",
    items: [
      { title: "Items, prices and photos", body: "Dishes, products or services, with descriptions in each language. Preview your changes, then publish them in one tap." },
      { title: "One-tap sold out, or stock", body: "Mark an item sold out from the list, or let shops track stock so items sell out by themselves." },
      { title: "Your colours and logo", body: "Your brand colour, logo and cover photo, adjusted automatically so text stays readable." },
      { title: "QR codes to print", body: "Download your page's QR code. The link never changes, so printed codes keep working." },
      { title: "AI photo enhancement", body: "Improve the lighting of your own photos. A monthly allowance comes with each plan." },
      { title: "Orders in one list", body: "Confirm, mark ready, complete or cancel each order and booking. See 30-day orders and sales on your dashboard." },
    ],
  },
  steps: {
    title: "Set up in three steps",
    items: [
      { title: "Create your account", body: "Pick your type of business and a web address, then verify your email." },
      { title: "Add your items", body: "Categories, items, prices, photos, hours and your WhatsApp number." },
      { title: "Share it", body: "Print the QR code for tables, the counter or the door, or share your link." },
    ],
  },
  pricing: {
    title: "Simple yearly plans",
    body: "Every plan starts with a 2-day free trial. To upgrade, request a plan from your dashboard and our team activates it.",
    perYear: "/ year",
    choose: "Start free trial",
    popular: "Most complete for one business",
    plans: [
      {
        id: "essential",
        name: "Essential",
        price: "$99",
        summary: "For a small menu, store or service list.",
        features: ["Up to 200 items", "Up to 20 categories", "Arabic and English", "Saved orders, also sent on WhatsApp", "Dollar and pound prices", "5 AI photo enhancements a month", "QR code and analytics"],
      },
      {
        id: "pro",
        name: "Pro",
        price: "$299",
        summary: "For bigger catalogues.",
        features: ["Up to 1,000 items", "Up to 50 categories", "Everything in Essential", "20 AI photo enhancements a month"],
      },
      {
        id: "enterprise",
        name: "Enterprise",
        price: "$399",
        summary: "For large catalogues and groups.",
        features: ["Up to 10,000 items", "Up to 200 categories", "Everything in Pro", "100 AI photo enhancements a month"],
      },
    ],
  },
  faq: {
    title: "Questions",
    items: [
      { q: "Which businesses is it for?", a: "Restaurants, cafés and bakeries, shops, and service businesses such as salons, clinics and repair shops. You choose your type when you sign up." },
      { q: "Do customers need to install an app?", a: "No. Your page opens in the phone's browser from the QR code or a short link." },
      { q: "Can I show prices in Lebanese pounds?", a: "Yes. Enter your rate and the page shows both currencies, rounded to the nearest 1,000 L.L. Change the rate whenever you need to." },
      { q: "Do customers pay online?", a: "Not yet. Orders are saved in your dashboard and sent to your WhatsApp, and customers pay in person or on delivery, as they do today." },
      { q: "What happens when I edit my page?", a: "You preview your changes, then publish them. Sold-out switches and stock change straight away. The QR code and link stay the same." },
      { q: "What if my subscription ends?", a: "Your public page is paused until you renew. Your items, orders and settings are kept." },
    ],
  },
  contact: {
    title: "Talk to us",
    body: "Questions, a demo for your team, or help adding your items. Message us on WhatsApp or by email.",
    whatsapp: "Message on WhatsApp",
    email: "Send an email",
  },
  footer: { rights: "© 2026 Coredex Solutions", demo: "Live demo", signup: "Start free trial", login: "Log in", privacy: "Privacy", terms: "Terms" },
};

type SiteCopy = typeof en;

const ar: SiteCopy = {
  metaTitle: "Coredex: قوائم ومتاجر وصفحات خدمات بالعربية والإنجليزية",
  metaDescription:
    "قائمتك أو متجرك أو صفحة خدماتك، تُفتح من رمز QR أو رابط. بالعربية والإنجليزية، الأسعار بالدولار والليرة اللبنانية، وكل طلب محفوظ ويصلك على واتساب.",
  nav: { modules: "لمن هو", features: "المزايا", pricing: "الأسعار", demo: "تجربة حيّة", faq: "أسئلة", start: "ابدأ التجربة المجانية", login: "تسجيل الدخول", language: "English" },
  hero: {
    eyebrow: "للمطاعم والمقاهي والمتاجر والخدمات",
    title: "قائمتك أو متجرك أو صفحة خدماتك، بالعربية والإنجليزية",
    body: "يفتحها زبائنك من رمز QR أو رابط، من دون أي تطبيق. الأسعار بالدولار والليرة، وكل طلب يُحفظ في لوحة التحكم ويصلك على واتساب.",
    primary: "ابدأ تجربة مجانية ليومين",
    secondary: "افتح التجربة الحيّة",
    note: "لا حاجة لبطاقة دفع. التجربة قائمة حقيقية يمكنك استخدامها.",
    noteNoDemo: "لا حاجة لبطاقة دفع.",
  },
  preview: { label: "قائمة تجريبية حيّة", sample: "قائمة نموذجية", open: "افتحها بملء الشاشة" },
  heroTitle: {
    lead: "نشاطك على الإنترنت،",
    rotating: ["بالعربية", "بالإنجليزية", "بالدولار والليرة"],
    full: "نشاطك على الإنترنت، بالعربية والإنجليزية، بالدولار والليرة",
  },
  modules: {
    eyebrow: "منصة واحدة لأربعة أنواع من الأعمال",
    title: "اختر نشاطك، واحصل على صفحة مصمّمة له.",
    body: "تختار نوع نشاطك عند التسجيل، فتتبعه الكلمات وشكل الصفحة وطريقة الطلب، ويمكنك إضافة ميزات لاحقاً.",
    start: "ابدأ التجربة المجانية",
    startAs: (label) => `ابدأ تجربة مجانية كـ: ${label}`,
    demo: "شاهد تجربة",
    demoOf: (label) => `شاهد تجربة: ${label}`,
    points: {
      restaurant: ["قائمة مع صور الأطباق والخيارات ومسببات الحساسية", "طلبات على الطاولة مع رموز QR، وسفري وتوصيل", "طلبات حجز الطاولات"],
      cafe: ["شبكة صور للمشروبات والحلويات والمخبوزات", "استلام مع وقت التجهيز، وطلبات مسبقة لتاريخ محدد", "أحجام وخيارات، مثل نوع الحليب أو السكر"],
      shop: ["شبكة منتجات مع الأحجام والألوان وأسعار التخفيض", "مخزون ينفد تلقائياً عند الصفر", "طلبات توصيل واستلام"],
      services: ["خدمات مع الأسعار ومدة كل منها", "طلبات مواعيد مع التاريخ والوقت المفضلين", "في محلك أو زيارة منزلية"],
    },
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
    body: "اكتب كل صنف باللغات التي تخدم بها. يبدّل الزبون فوراً، وتنقلب الصفحة كلها من اليمين إلى اليسار بالعربية.",
    switchTo: "Show in English",
    switchBack: "عرض بالعربية",
  },
  whatsappDemo: {
    eyebrow: "طلبات محفوظة، وعلى واتساب أيضاً",
    title: "طلبات تصلك واضحة وجاهزة",
    body: "يُحفظ كل طلب برقمه في صفحة الطلبات، ويصلك أيضاً على واتساب برسالة واحدة واضحة فيها الطاولة أو العنوان، وكل الأصناف والملاحظات، والمجموع بالعملتين.",
    chatName: "مطعمك",
    note: "هذا هو شكل الرسالة الذي يرسله الزبائن فعلاً.",
    sampleName: "رامي",
    samplePhone: "71 123 456",
    restaurant: "مطعمك",
  },
  cta: {
    title: "ضع نشاطك على الإنترنت هذا الأسبوع",
    body: "ابدأ التجربة المجانية ليومين، أضف أصنافك وشارك رابطك أو رمز QR. يمكننا مساعدتك في الإعداد عبر واتساب.",
    primary: "ابدأ التجربة المجانية",
    secondary: "تواصل معنا على واتساب",
  },
  guests: {
    title: "ما يحصل عليه زبائنك",
    items: [
      { title: "تفتح من الكاميرا", body: "مسح رمز QR أو الضغط على رابطك يفتح الصفحة في المتصفح. لا تحميل ولا حساب." },
      { title: "عربي وإنجليزي", body: "يغيّر الزبون اللغة بلمسة واحدة، والعربية تُعرض من اليمين إلى اليسار كما يجب." },
      { title: "الدولار والليرة جنباً إلى جنب", body: "أنت تحدد سعر الصرف، والصفحة تُظهر تاريخ آخر تعديل ولا تفترض أي سعر." },
      { title: "طلب يناسب نشاطك", body: "داخل المحل أو سفري أو توصيل أو استلام أو موعد: لكل نشاط طريقته. كل طلب يُحفظ ويصلك على واتساب." },
      { title: "بحث يفهم العربية", body: "يجد «منقوشة» حتى لو كُتبت «منقوشه»، مع التشكيل أو من دونه." },
      { title: "ساعات العمل والأصناف النافدة", body: "يرى الزبون إن كنت مفتوحاً الآن، والأصناف النافدة تظهر عليها علامة بدل أن تختفي." },
    ],
  },
  owners: {
    title: "ما تديره أنت",
    items: [
      { title: "الأصناف والأسعار والصور", body: "أطباق أو منتجات أو خدمات، مع الوصف بكل لغة. عاين تعديلاتك ثم انشرها بلمسة واحدة." },
      { title: "«نفدت الكمية» بلمسة، أو المخزون", body: "علّم الصنف كنافد من اللائحة، أو دع المتجر يتتبع المخزون فينفد الصنف تلقائياً." },
      { title: "ألوانك وشعارك", body: "لون علامتك وشعارك وصورة الغلاف، مع ضبط تلقائي لتبقى النصوص واضحة." },
      { title: "رموز QR للطباعة", body: "حمّل رمز QR لصفحتك. الرابط لا يتغير، فتبقى الرموز المطبوعة صالحة." },
      { title: "تحسين الصور بالذكاء الاصطناعي", body: "حسّن إضاءة صورك الحقيقية، مع رصيد شهري ضمن كل باقة." },
      { title: "الطلبات في لائحة واحدة", body: "أكّد كل طلب وحجز، أو علّمه جاهزاً أو منتهياً، أو ألغِه. وتابع طلبات ومبيعات آخر 30 يوماً في لوحة التحكم." },
    ],
  },
  steps: {
    title: "التشغيل في ثلاث خطوات",
    items: [
      { title: "أنشئ حسابك", body: "اختر نوع نشاطك ورابطاً لصفحتك، ثم أكّد بريدك الإلكتروني." },
      { title: "أضف أصنافك", body: "الأقسام والأصناف والأسعار والصور وساعات العمل ورقم واتساب." },
      { title: "شاركها", body: "اطبع رمز QR للطاولات أو الصندوق أو الباب، أو شارك رابطك." },
    ],
  },
  pricing: {
    title: "باقات سنوية بسيطة",
    body: "كل باقة تبدأ بتجربة مجانية ليومين. للترقية، اطلب الباقة من لوحة التحكم ويفعّلها فريقنا.",
    perYear: "/ سنوياً",
    choose: "ابدأ التجربة المجانية",
    popular: "الأكمل لنشاط واحد",
    plans: [
      {
        id: "essential",
        name: "Essential",
        price: "$99",
        summary: "لقائمة أو متجر أو لائحة خدمات صغيرة.",
        features: ["حتى 200 صنف", "حتى 20 قسماً", "بالعربية والإنجليزية", "طلبات محفوظة تصلك على واتساب أيضاً", "أسعار بالدولار والليرة", "5 تحسينات صور شهرياً", "رمز QR وإحصاءات"],
      },
      {
        id: "pro",
        name: "Pro",
        price: "$299",
        summary: "للأنشطة الأكبر.",
        features: ["حتى 1,000 صنف", "حتى 50 قسماً", "كل ما في Essential", "20 تحسين صور شهرياً"],
      },
      {
        id: "enterprise",
        name: "Enterprise",
        price: "$399",
        summary: "للأنشطة الكبيرة والمجموعات.",
        features: ["حتى 10,000 صنف", "حتى 200 قسم", "كل ما في Pro", "100 تحسين صور شهرياً"],
      },
    ],
  },
  faq: {
    title: "أسئلة",
    items: [
      { q: "لأي أنواع الأعمال؟", a: "المطاعم، والمقاهي والأفران، والمتاجر، وأعمال الخدمات مثل الصالونات والعيادات ومحلات التصليح. تختار نوع نشاطك عند التسجيل." },
      { q: "هل يحتاج الزبائن إلى تثبيت تطبيق؟", a: "لا. تفتح صفحتك في متصفح الهاتف من رمز QR أو رابط قصير." },
      { q: "هل يمكنني عرض الأسعار بالليرة اللبنانية؟", a: "نعم. أدخل سعر الصرف فتعرض الصفحة العملتين، مع تقريب الليرة إلى أقرب 1,000 ل.ل. ويمكنك تغيير السعر متى شئت." },
      { q: "هل يدفع الزبائن عبر الإنترنت؟", a: "ليس بعد. تُحفظ الطلبات في لوحة التحكم وتصلك على واتساب، والدفع وجهاً لوجه أو عند التوصيل كما يحدث اليوم." },
      { q: "ماذا يحدث عندما أعدّل صفحتي؟", a: "تعاين تعديلاتك ثم تنشرها. أما «نفدت الكمية» والمخزون فيتغيران فوراً. ويبقى رمز QR والرابط كما هما." },
      { q: "ماذا لو انتهى اشتراكي؟", a: "تتوقف صفحتك العامة مؤقتاً حتى التجديد، وتبقى أصنافك وطلباتك وإعداداتك محفوظة." },
    ],
  },
  contact: {
    title: "تواصل معنا",
    body: "أسئلة، أو عرض لفريقك، أو مساعدة في إدخال أصنافك. راسلنا على واتساب أو عبر البريد الإلكتروني.",
    whatsapp: "راسلنا على واتساب",
    email: "أرسل بريداً إلكترونياً",
  },
  footer: { rights: "© 2026 Coredex Solutions", demo: "تجربة حيّة", signup: "ابدأ التجربة المجانية", login: "تسجيل الدخول", privacy: "الخصوصية", terms: "الشروط" },
};

export type { SiteCopy };

export function getSiteCopy(lang: SiteLang): SiteCopy {
  return lang === "ar" ? ar : en;
}
