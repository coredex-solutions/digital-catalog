// Seeds the public demo menu at /c/demo: a sample Lebanese restaurant with
// dual USD/LBP prices, dine-in/takeaway/delivery ordering, Arabic and English text.
// Re-running replaces the demo catalog (and only the demo catalog).
//
//   npx tsx scripts/seed-demo.ts
//
// The demo admin password comes from DEMO_ADMIN_PASSWORD, or is generated and printed once.
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();

import { createClient, type InStatement } from '@libsql/client';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { publishMenu } from '../lib/catalog/publishing';

const db = createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN,
});

const SLUG = 'demo';
const CATALOG_ID = 'demo-catalog-001';
const ADMIN_EMAIL = 'demo@example.com';
// Orders and calls from the demo go to the Coredex sales number
const PHONE = '+966540679669';
const LBP_RATE = 89500;

// Free photos from Unsplash (unsplash.com/license) or the local landing images
const unsplash = (id: string, w = 600, h = 450) =>
    `https://images.unsplash.com/${id}?w=${w}&h=${h}&fit=crop&q=80`;

type Item = {
    id: string; cat: string; price: number; img?: string; featured?: boolean; soldOut?: boolean;
    en: [string, string]; ar: [string, string];
    // Options with their own price; dietary tags; allergens only where "verified" (else unknown)
    variants?: { id: string; name_en: string; name_ar: string; price: number }[];
    dietary?: string[]; allergens?: string[];
};

const CATEGORIES = [
    { id: 'cat-cold', icon: 'Salad', en: 'Cold mezze', ar: 'مازة باردة' },
    { id: 'cat-hot', icon: 'Flame', en: 'Hot mezze', ar: 'مازة ساخنة' },
    { id: 'cat-grills', icon: 'Beef', en: 'Grills', ar: 'مشاوي' },
    { id: 'cat-sandwiches', icon: 'Sandwich', en: 'Sandwiches', ar: 'سندويشات' },
    { id: 'cat-desserts', icon: 'Cake', en: 'Desserts', ar: 'حلويات' },
    { id: 'cat-drinks', icon: 'CupSoda', en: 'Drinks', ar: 'مشروبات' },
];

const ITEMS: Item[] = [
    // Cold mezze
    { id: 'item-hummus', dietary: ['vegetarian', 'vegan'], allergens: ['sesame'], cat: 'cat-cold', price: 4, featured: true, img: unsplash('photo-1637949385162-e416fb15b2ce'),
      en: ['Hummus', 'Chickpeas, tahini, lemon and olive oil'],
      ar: ['حمص', 'حمص بالطحينة والليمون وزيت الزيتون'] },
    { id: 'item-tabbouleh', dietary: ['vegetarian', 'vegan'], cat: 'cat-cold', price: 5, img: unsplash('photo-1786174044919-c2119725afa1'),
      en: ['Tabbouleh', 'Parsley, tomato, bulgur, mint and lemon'],
      ar: ['تبولة', 'بقدونس، بندورة، برغل، نعنع وليمون'] },
    { id: 'item-fattoush', dietary: ['vegetarian', 'vegan'], cat: 'cat-cold', price: 5,
      en: ['Fattoush', 'Garden vegetables, toasted bread and sumac dressing'],
      ar: ['فتوش', 'خضار مشكلة، خبز محمص وصلصة السماق'] },
    { id: 'item-baba', dietary: ['vegetarian', 'vegan'], allergens: ['sesame'], cat: 'cat-cold', price: 4.5, img: '/landing/baba-ganoush.png',
      en: ['Baba ghanoush', 'Smoked eggplant, tahini and pomegranate'],
      ar: ['بابا غنوج', 'باذنجان مشوي مع الطحينة والرمان'] },
    { id: 'item-labneh', cat: 'cat-cold', price: 4,
      en: ['Labneh', 'Strained yogurt, olive oil and dried mint'],
      ar: ['لبنة', 'لبنة مع زيت الزيتون والنعنع اليابس'] },

    // Hot mezze
    { id: 'item-falafel', dietary: ['vegetarian', 'vegan'], allergens: ['sesame', 'gluten'], cat: 'cat-hot', price: 4, img: unsplash('photo-1593001872095-7d5b3868fb1d'),
      en: ['Falafel', 'Six pieces with tahini sauce'],
      ar: ['فلافل', 'ست حبات مع الطراطور'] },
    { id: 'item-kibbeh', cat: 'cat-hot', price: 6, featured: true, img: '/landing/kibbeh.png',
      en: ['Fried kibbeh', 'Bulgur shells filled with spiced meat and pine nuts'],
      ar: ['كبة مقلية', 'برغل محشو باللحمة المتبّلة والصنوبر'] },
    { id: 'item-hummus-meat', cat: 'cat-hot', price: 7, img: unsplash('photo-1783696074463-3fb850d181a1'),
      en: ['Hummus with meat', 'Hummus topped with sautéed beef and pine nuts'],
      ar: ['حمص باللحمة', 'حمص مع لحمة مقلية وصنوبر'] },
    { id: 'item-batata', dietary: ['vegetarian', 'spicy'], cat: 'cat-hot', price: 4,
      en: ['Batata harra', 'Spicy potatoes with garlic, coriander and chili'],
      ar: ['بطاطا حرة', 'بطاطا مع الثوم والكزبرة والفلفل الحار'] },

    // Grills
    { id: 'item-mixed-grill', cat: 'cat-grills', price: 18, featured: true, img: unsplash('photo-1771285119318-b342c3ecc51c'),
      en: ['Mixed grill', 'Kafta, shish taouk and lamb cubes with grilled vegetables'],
      ar: ['مشاوي مشكلة', 'كفتة، شيش طاووق ولحم غنم مع خضار مشوية'] },
    { id: 'item-taouk', cat: 'cat-grills', price: 11, img: unsplash('photo-1779086646395-00668466d0d0'),
      en: ['Shish taouk', 'Marinated chicken skewers with garlic sauce and fries'],
      ar: ['شيش طاووق', 'أسياخ دجاج متبّلة مع الثوم والبطاطا'] },
    { id: 'item-kafta', cat: 'cat-grills', price: 12, img: unsplash('photo-1603360946369-dc9bb6258143'),
      en: ['Kafta skewers', 'Minced beef with parsley and onion, with fries and tomatoes'],
      ar: ['كفتة مشوية', 'لحمة مفرومة مع بقدونس وبصل، مع بطاطا وبندورة'] },

    // Sandwiches
    { id: 'item-shawarma', variants: [{ id: 'regular', name_en: 'Regular', name_ar: 'عادي', price: 6 }, { id: 'large', name_en: 'Large', name_ar: 'كبير', price: 8 }], cat: 'cat-sandwiches', price: 6, featured: true, img: unsplash('photo-1529006557810-274b9b2fc783'),
      en: ['Chicken shawarma', 'Garlic sauce, pickles and fries in Lebanese bread'],
      ar: ['شاورما دجاج', 'ثوم، كبيس وبطاطا بخبز لبناني'] },
    { id: 'item-falafel-wrap', cat: 'cat-sandwiches', price: 4, img: unsplash('photo-1760888548893-bc2f7e09e972'),
      en: ['Falafel wrap', 'Falafel, tahini, tomato, parsley and pickles'],
      ar: ['سندويش فلافل', 'فلافل، طراطور، بندورة، بقدونس وكبيس'] },
    { id: 'item-kafta-sandwich', cat: 'cat-sandwiches', price: 5,
      en: ['Kafta sandwich', 'Grilled kafta, hummus, tomato and onion'],
      ar: ['سندويش كفتة', 'كفتة مشوية، حمص، بندورة وبصل'] },

    // Desserts
    { id: 'item-baklava', allergens: ['gluten', 'tree_nuts', 'milk'], cat: 'cat-desserts', price: 5, img: unsplash('photo-1761828122856-8703baac8e86'),
      en: ['Baklava', 'Filo pastry with pistachios and syrup, four pieces'],
      ar: ['بقلاوة', 'عجينة رقائق بالفستق والقطر، أربع قطع'] },
    { id: 'item-ish-bulbul', cat: 'cat-desserts', price: 4, img: unsplash('photo-1778447812923-88a9e3e6b567'),
      en: ['Ish el bulbul', 'Crisp kataifi nest filled with pistachios'],
      ar: ['عش البلبل', 'عجينة كنافة مقرمشة محشوة بالفستق'] },

    // Drinks
    { id: 'item-lemonade', cat: 'cat-drinks', price: 3, img: unsplash('photo-1555949366-819808d99159'),
      en: ['Lemonade with mint', 'Fresh lemons and mint'],
      ar: ['ليموناضة بالنعناع', 'ليمون طازج ونعناع'] },
    { id: 'item-orange', variants: [{ id: 'small', name_en: 'Small', name_ar: 'صغير', price: 3 }, { id: 'large', name_en: 'Large', name_ar: 'كبير', price: 4 }], cat: 'cat-drinks', price: 3, img: unsplash('photo-1600271886742-f049cd451bba'),
      en: ['Fresh orange juice', 'Squeezed to order'],
      ar: ['عصير برتقال طازج', 'يُعصر عند الطلب'] },
    { id: 'item-coffee', cat: 'cat-drinks', price: 2, img: unsplash('photo-1757079649052-a24c6ab32c64'),
      en: ['Lebanese coffee', 'Cardamom coffee, served in a small cup'],
      ar: ['قهوة عربية', 'قهوة بالهيل بفنجان صغير'] },
    { id: 'item-jallab', cat: 'cat-drinks', price: 3, soldOut: true,
      en: ['Jallab', 'Grape molasses and rose water with pine nuts and raisins'],
      ar: ['جلاب', 'دبس العنب وماء الورد مع الصنوبر والزبيب'] },
    { id: 'item-ayran', allergens: ['milk'], cat: 'cat-drinks', price: 2,
      en: ['Ayran', 'Chilled salted yogurt drink'],
      ar: ['عيران', 'لبن بارد مملّح'] },
];

const FAQS = [
    {
        en: ['Do you deliver?', 'Yes, within Beirut. Choose “Delivery” when you send your order and we confirm the fee on WhatsApp.'],
        ar: ['هل لديكم توصيل؟', 'نعم، داخل بيروت. اختر "توصيل" عند إرسال طلبك ونؤكد رسم التوصيل عبر واتساب.'],
    },
    {
        en: ['Can I pay in dollars or Lebanese pounds?', 'Both. Prices show in dollars and in pounds at the rate on the menu.'],
        ar: ['هل يمكنني الدفع بالدولار أو بالليرة؟', 'الاثنان. الأسعار معروضة بالدولار وبالليرة حسب السعر المذكور في القائمة.'],
    },
    {
        en: ['Is this a real restaurant?', 'No. This is a Coredex demo menu so you can try ordering. Orders sent from it go to the Coredex team.'],
        ar: ['هل هذا مطعم حقيقي؟', 'لا. هذه قائمة تجريبية من Coredex لتجربة الطلب. الطلبات المرسلة منها تصل إلى فريق Coredex.'],
    },
];

async function seedDemo() {
    console.log('Seeding the demo catalog...');

    const adminPassword = process.env.DEMO_ADMIN_PASSWORD || randomBytes(12).toString('base64url');
    const passwordHash = await bcrypt.hash(adminPassword, 10);
    const now = new Date().toISOString();
    const nextYear = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();

    // Child tables first, so an old demo is fully removed even without ON DELETE CASCADE
    const old = await db.execute({ sql: 'SELECT id FROM catalogs WHERE slug = ?', args: [SLUG] });
    const cleanup: InStatement[] = old.rows.flatMap((row) => [
        ...['catalog_menu_versions', 'menu_items', 'categories', 'operating_hours', 'branches', 'faqs', 'social_media', 'catalog_contact',
            'catalog_settings', 'catalog_admins', 'catalog_subscriptions'].map((table) => ({
            sql: `DELETE FROM ${table} WHERE catalog_id = ?`, args: [row.id as string],
        })),
        { sql: 'DELETE FROM catalogs WHERE id = ?', args: [row.id as string] },
    ]);

    // The *_fr columns still exist (some are NOT NULL) but the product has no French: they get ''
    const statements: InStatement[] = [
        ...cleanup,
        {
            sql: `INSERT INTO catalogs (id, slug, name, name_en, name_ar, name_fr, business_type,
                    description, description_en, description_ar, description_fr, logo_url, is_active, created_at, updated_at)
                  VALUES (?, ?, ?, ?, ?, ?, 'restaurant', ?, ?, ?, ?, ?, 1, ?, ?)`,
            args: [
                CATALOG_ID, SLUG, 'Sofra', 'Sofra', 'سفرة', '',
                'Lebanese mezze, grills and sandwiches. A Coredex demo menu.',
                'Lebanese mezze, grills and sandwiches. A Coredex demo menu.',
                'مازة ومشاوي وسندويشات لبنانية. قائمة تجريبية من Coredex.',
                '',
                '/landing/hummus.png', now, now,
            ],
        },
        {
            sql: `INSERT INTO catalog_subscriptions (id, catalog_id, subscription_type, starts_at, expires_at,
                    multi_language_enabled, booking_enabled, analytics_enabled,
                    ai_image_enhancement_limit, max_items, max_categories, is_active, created_at)
                  VALUES (?, ?, 'enterprise', ?, ?, 1, 1, 1, 0, 500, 50, 1, ?)`,
            args: ['demo-sub-001', CATALOG_ID, now, nextYear, now],
        },
        {
            sql: `INSERT INTO catalog_settings (catalog_id, color_primary, hero_image_url, enabled_languages, default_language,
                    currency_primary, lbp_exchange_rate, lbp_rate_updated_at, show_dual_currency, order_types,
                    delivery_note_en, delivery_note_ar, booking_enabled, whatsapp_order_enabled,
                    seo_title_en, seo_description_en, seo_title_ar, seo_description_ar, seo_title_fr, seo_description_fr)
                  VALUES (?, '#0F6B5B', ?, 'ar,en', 'en', 'USD', ?, ?, 1, 'dine_in,takeaway,delivery',
                    ?, ?, 1, 1, ?, ?, ?, ?, ?, ?)`,
            args: [
                CATALOG_ID, unsplash('photo-1767114915974-3481fa23cbb0', 1200, 600), LBP_RATE, now,
                'Delivery within Beirut. We confirm the fee on WhatsApp.',
                'توصيل داخل بيروت. نؤكد رسم التوصيل عبر واتساب.',
                'Sofra · Coredex demo menu', 'Try a Coredex QR menu: Lebanese dishes priced in dollars and pounds, ordered through WhatsApp.',
                'سفرة · قائمة Coredex التجريبية', 'جرّب قائمة QR من Coredex: أطباق لبنانية بالدولار والليرة، والطلب عبر واتساب.',
                '', '',
            ],
        },
        {
            sql: `INSERT INTO catalog_contact (catalog_id, phone_primary, phone_whatsapp, email,
                    address_en, address_ar, address_fr, city_en, city_ar, city_fr, country_en, country_ar, country_fr)
                  VALUES (?, ?, ?, ?, ?, ?, ?, 'Beirut', 'بيروت', '', 'Lebanon', 'لبنان', '')`,
            args: [
                CATALOG_ID, PHONE, PHONE, 'info@coredex.solutions',
                'Demo address, Hamra', 'عنوان تجريبي، الحمرا', '',
            ],
        },
        {
            sql: `INSERT INTO catalog_admins (id, catalog_id, email, password_hash, name, role, is_active, created_at)
                  VALUES ('demo-admin-001', ?, ?, ?, 'Demo Admin', 'admin', 1, ?)`,
            args: [CATALOG_ID, ADMIN_EMAIL, passwordHash, now],
        },
        ...CATEGORIES.map((cat, order) => ({
            sql: `INSERT INTO categories (id, catalog_id, name_en, name_ar, name_fr, icon_name, display_order, is_active, created_at)
                  VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)`,
            args: [cat.id, CATALOG_ID, cat.en, cat.ar, '', cat.icon, order, now],
        })),
        ...ITEMS.map((item, order) => ({
            sql: `INSERT INTO menu_items (id, catalog_id, category_id, name_en, name_ar, name_fr,
                    description_en, description_ar, description_fr, price, currency, image_url,
                    display_order, is_active, is_featured, is_available, variants, dietary, allergens, created_at)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'USD', ?, ?, 1, ?, ?, ?, ?, ?, ?)`,
            args: [
                item.id, CATALOG_ID, item.cat, item.en[0], item.ar[0], '',
                item.en[1], item.ar[1], '', item.price, item.img ?? null,
                order, item.featured ? 1 : 0, item.soldOut ? 0 : 1,
                item.variants ? JSON.stringify(item.variants) : null,
                item.dietary ? JSON.stringify(item.dietary) : null,
                // Only dishes the "restaurant" verified get a list; the rest stay unknown (NULL)
                item.allergens ? JSON.stringify(item.allergens) : null,
                now,
            ],
        })),
        ...['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => ({
            sql: `INSERT INTO operating_hours (catalog_id, day_name, open_hour, close_hour, is_closed) VALUES (?, ?, ?, ?, 0)`,
            args: [CATALOG_ID, day, 11, day === 'Friday' || day === 'Saturday' ? 24 : 23],
        })),
        {
            sql: `INSERT INTO branches (id, catalog_id, name_en, name_ar, name_fr, address_en, address_ar, address_fr,
                    phone_numbers, map_url, display_order, is_active)
                  VALUES ('demo-branch-001', ?, 'Hamra', 'الحمرا', '', 'Demo address, Hamra, Beirut',
                    'عنوان تجريبي، الحمرا، بيروت', '', ?, ?, 0, 1)`,
            args: [CATALOG_ID, JSON.stringify([PHONE]), 'https://maps.google.com/?q=Hamra+Street+Beirut'],
        },
        ...FAQS.map((faq, i) => ({
            sql: `INSERT INTO faqs (id, catalog_id, question_en, answer_en, question_ar, answer_ar, question_fr, answer_fr, display_order, is_active)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
            args: [`demo-faq-${i}`, CATALOG_ID, faq.en[0], faq.en[1], faq.ar[0], faq.ar[1], '', '', i],
        })),
    ];

    // One transaction: the demo is either fully replaced or left as it was
    await db.batch(statements, 'write');

    // Publish it, so guests see the menu (new menus start as unpublished drafts)
    await publishMenu(CATALOG_ID, ADMIN_EMAIL, 'Demo menu');

    console.log(`Created "${SLUG}": ${CATEGORIES.length} categories, ${ITEMS.length} dishes, ${FAQS.length} FAQs`);
    console.log(`Demo admin: ${ADMIN_EMAIL} / ${adminPassword}  (save this password; it is not stored anywhere else)`);
    console.log('Menu: /c/demo   Admin: /c/demo/admin');
}

seedDemo().catch((error) => {
    console.error(error);
    process.exit(1);
});
