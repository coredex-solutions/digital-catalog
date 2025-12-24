// Restaurant settings seed data
export const SEED_RESTAURANT_SETTINGS = {
  google_map_iframe_url:
    "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2706.0748714549336!2d44.44005714457789!3d33.32164936418778!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x155783f407325e0b%3A0xbc5af51a7af7af11!2sChicken%20Mtabal%20restaurant!5e1!3m2!1sen!2slb!4v1763810181537!5m2!1sen!2slb",
  phone_reservation: "07818006006",
  phone_checkout: "07818006006",
  whatsapp: "9647718006006",
  email: "info@mtabal.restaurant",
  address_ar: "بغداد - زيونة - شارع الخدمي",
  address_en: "Baghdad - Zayouna - Service Street",
  address_fr: "Bagdad - Zayouna - Rue de Service",
};

export const SEED_OPERATING_HOURS = [
  { day_name: "sunday", open_hour: 11, close_hour: 23.5, is_closed: false },
  { day_name: "monday", open_hour: 11, close_hour: 23.5, is_closed: false },
  { day_name: "tuesday", open_hour: 11, close_hour: 23.5, is_closed: false },
  { day_name: "wednesday", open_hour: 11, close_hour: 23.5, is_closed: false },
  { day_name: "thursday", open_hour: 11, close_hour: 23.5, is_closed: false },
  { day_name: "friday", open_hour: 11, close_hour: 23.5, is_closed: false },
  { day_name: "saturday", open_hour: 11, close_hour: 23.5, is_closed: false },
];

export const SEED_SOCIAL_MEDIA = [
  {
    id: "instagram",
    platform: "instagram",
    url: "https://instagram.com/mtabal.restaurant",
  },
  {
    id: "facebook",
    platform: "facebook",
    url: "https://facebook.com/mtabalrestaurant",
  },
  {
    id: "tiktok",
    platform: "tiktok",
    url: "https://tiktok.com/@mtabal.restaurant",
  },
  { id: "youtube", platform: "youtube", url: "" },
];

export const SEED_BRANCHES = [
  {
    id: "branch_main",
    name_ar: "الفرع الرئيسي",
    name_en: "Main Branch",
    name_fr: "Branche Principale",
    address_ar:
      "بغداد - زيونة - شارع الخدمي مقابل ملعب الشعب داخل فرع مطعم ويست بركر",
    address_en:
      "Baghdad - Zayouna - Service Street opposite Al-Shaab Stadium inside West Burger",
    address_fr: "Bagdad - Zayouna - Rue de Service en face du stade Al-Shaab",
    phone_numbers: ["078 1800 6006", "077 1800 6006"],
    map_url:
      "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2706.0748714549336!2d44.44005714457789!3d33.32164936418778!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x155783f407325e0b%3A0xbc5af51a7af7af11!2sChicken%20Mtabal%20restaurant!5e1!3m2!1sen!2slb!4v1763810181537!5m2!1sen!2slb",
    display_order: 1,
  },
  {
    id: "branch_second",
    name_ar: "الفرع الثاني",
    name_en: "Second Branch",
    name_fr: "Deuxième Branche",
    address_ar:
      "صلاح الدين - تكريت - شارع الرئيسي موصل تكريت مجاور مركز شرطة تكريت",
    address_en:
      "Salah Al-Din - Tikrit - Main Street Mosul-Tikrit next to Tikrit Police Station",
    address_fr:
      "Salah Al-Din - Tikrit - Rue Principale Mossoul-Tikrit à côté du poste de police de Tikrit",
    phone_numbers: ["078 26333310", "077 26333310"],
    map_url: "",
    display_order: 2,
  },
];

export const SEED_FAQS = [
  {
    id: "faq_hours",
    question_ar: "ما هي ساعات العمل؟",
    question_en: "What are your opening hours?",
    question_fr: "Quelles sont vos heures d'ouverture?",
    answer_ar: "نحن نعمل يومياً من الساعة 11:00 صباحاً حتى 11:30 مساءً.",
    answer_en: "We are open daily from 11:00 AM to 11:30 PM.",
    answer_fr: "Nous sommes ouverts tous les jours de 11h00 à 23h30.",
    display_order: 1,
  },
  {
    id: "faq_location",
    question_ar: "أين يقع المطعم؟",
    question_en: "Where is the restaurant located?",
    question_fr: "Où se trouve le restaurant?",
    answer_ar:
      "الفرع الرئيسي: بغداد - زيونة - شارع الخدمي مقابل ملعب الشعب داخل فرع مطعم ويست بركر. لدينا فروع أخرى أيضاً.",
    answer_en:
      "Main Branch: Baghdad - Zayouna - Service Street opposite Al-Shaab Stadium inside West Burger. We have other branches too.",
    answer_fr:
      "Branche principale : Bagdad - Zayouna - Rue Service en face du stade Al-Shaab. Nous avons d'autres branches aussi.",
    display_order: 2,
  },
  {
    id: "faq_reservation",
    question_ar: "كيف يمكنني حجز طاولة؟",
    question_en: "How can I book a table?",
    question_fr: "Comment puis-je réserver une table?",
    answer_ar:
      "يمكنك الحجز مباشرة من خلال زر 'حجز طاولة' في الصفحة الرئيسية أو الاتصال بنا على 078 1800 6006.",
    answer_en:
      "You can book directly through the 'Book a Table' button on the home page or call us at 078 1800 6006.",
    answer_fr:
      "Vous pouvez réserver directement via le bouton 'Réserver une table' sur la page d'accueil ou appelez-nous au 078 1800 6006.",
    display_order: 3,
  },
  {
    id: "faq_delivery",
    question_ar: "هل لديكم توصيل؟",
    question_en: "Do you offer delivery?",
    question_fr: "Proposez-vous la livraison?",
    answer_ar:
      "نعم، نقوم بالتوصيل! يمكنك تصفح القائمة وإضافة العناصر إلى السلة ثم تأكيد الطلب عبر واتساب.",
    answer_en:
      "Yes, we deliver! You can browse the menu, add items to your cart, and confirm your order via WhatsApp.",
    answer_fr:
      "Oui, nous livrons ! Vous pouvez parcourir le menu, ajouter des articles à votre panier et confirmer votre commande via WhatsApp.",
    display_order: 4,
  },
  {
    id: "faq_payment",
    question_ar: "ما هي طرق الدفع المتاحة؟",
    question_en: "What payment methods do you accept?",
    question_fr: "Quels modes de paiement acceptez-vous?",
    answer_ar:
      "نقبل الدفع نقداً عند الاستلام أو في المطعم. يمكنكم أيضاً الدفع عبر التطبيقات الإلكترونية.",
    answer_en:
      "We accept cash on delivery or at the restaurant. You can also pay via electronic payment apps.",
    answer_fr:
      "Nous acceptons le paiement en espèces à la livraison ou au restaurant. Vous pouvez également payer via des applications de paiement électronique.",
    display_order: 5,
  },
  {
    id: "faq_menu",
    question_ar: "هل لديكم قائمة طعام خاصة؟",
    question_en: "Do you have a special menu?",
    question_fr: "Avez-vous un menu spécial?",
    answer_ar:
      "نعم، نتخصص في الدجاج المتبل المشوي على الفحم، المناسف، والوجبات التقليدية العربية.",
    answer_en:
      "Yes, we specialize in marinated charcoal-grilled chicken, Mansaf, and traditional Arabic meals.",
    answer_fr:
      "Oui, nous nous spécialisons dans le poulet mariné grillé au charbon, le Mansaf et les plats arabes traditionnels.",
    display_order: 6,
  },
  {
    id: "faq_group",
    question_ar: "هل تستقبلون المجموعات والحفلات؟",
    question_en: "Do you accommodate groups and parties?",
    question_fr: "Accueillez-vous des groupes et des fêtes?",
    answer_ar:
      "نعم، نرحب بالمجموعات والحفلات. يرجى الاتصال بنا مسبقاً لترتيب الحجز.",
    answer_en:
      "Yes, we welcome groups and parties. Please contact us in advance to arrange your booking.",
    answer_fr:
      "Oui, nous accueillons des groupes et des fêtes. Veuillez nous contacter à l'avance pour organiser votre réservation.",
    display_order: 7,
  },
  {
    id: "faq_parking",
    question_ar: "هل يوجد موقف سيارات؟",
    question_en: "Is there parking available?",
    question_fr: "Y a-t-il un parking disponible?",
    answer_ar: "نعم، يتوفر موقف سيارات بالقرب من المطعم.",
    answer_en: "Yes, parking is available near the restaurant.",
    answer_fr: "Oui, un parking est disponible près du restaurant.",
    display_order: 8,
  },
];
