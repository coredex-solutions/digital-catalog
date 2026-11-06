// Seeds demo pages for the café, shop, services and stays modules, next to the restaurant demo
// (scripts/seed-demo.ts, /c/demo):
//   /c/demo-cafe      Café & Bakery
//   /c/demo-shop      Shop (with stock and a sale price)
//   /c/demo-services  Services (with durations and appointment requests)
//   /c/demo-stays     Guesthouse & Chalets (rooms by the night, weekend prices, a deposit)
// Re-running replaces these catalogs (and only them).
//
//   npx tsx scripts/seed-demo-modules.ts
//   DEMO_ONLY=demo-stays npx tsx scripts/seed-demo-modules.ts   (just one of them)
//
// Each admin password comes from DEMO_ADMIN_PASSWORD, or is generated and printed once.
// No photos: the pages show a lettered tile instead, so there are no borrowed images to break.
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();

import { createClient, type InStatement } from '@libsql/client';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { publishMenu } from '../lib/catalog/publishing';
import { MODULES, type ModuleId } from '../lib/modules/registry';

const db = createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN,
});

// Orders and calls from the demos go to the Core Commerce sales number (same as the restaurant demo)
const PHONE = '+966540679669';
const LBP_RATE = 89500;

type Variant = { id: string; en: string; ar: string; price: number };
type DemoItem = {
    id: string; cat: string; price: number; featured?: boolean;
    en: [string, string]; ar: [string, string];
    variants?: Variant[]; stock?: number; compareAt?: number; minutes?: number; sku?: string;
    units?: number; guests?: number; weekend?: number;
};
type Demo = {
    slug: string; id: string; module: ModuleId; subType: string;
    name: { en: string; ar: string }; description: { en: string; ar: string };
    orderTypes: string; color: string; hours: [number, number]; closedDays?: string[];
    deliveryNote?: { en: string; ar: string };
    /** Stays: catalog_settings.stay_config */
    stayConfig?: Record<string, unknown>;
    categories: { id: string; en: string; ar: string }[];
    items: DemoItem[];
};

const DEMOS: Demo[] = [
    {
        slug: 'demo-cafe', id: 'demo-cafe-001', module: 'cafe', subType: 'cafe',
        name: { en: 'Fincan', ar: 'فنجان' },
        description: { en: 'Coffee, sweets and morning bakes. A Core Commerce demo café.', ar: 'قهوة وحلويات ومخبوزات الصباح. مقهى تجريبي من Core Commerce.' },
        orderTypes: 'takeaway,dine_in,delivery', color: '#7A4B2A', hours: [7, 22],
        deliveryNote: { en: 'Delivery nearby. We confirm the fee on WhatsApp.', ar: 'توصيل إلى المناطق القريبة. نؤكد الرسم عبر واتساب.' },
        categories: [
            { id: 'cafe-coffee', en: 'Coffee', ar: 'قهوة' },
            { id: 'cafe-sweets', en: 'Sweets', ar: 'حلويات' },
            { id: 'cafe-bakery', en: 'Bakery', ar: 'مخبوزات' },
        ],
        items: [
            { id: 'cafe-espresso', cat: 'cafe-coffee', price: 2, en: ['Espresso', 'Single or double shot'], ar: ['إسبريسو', 'شوت واحد أو مزدوج'],
              variants: [{ id: 'single', en: 'Single', ar: 'واحد', price: 2 }, { id: 'double', en: 'Double', ar: 'مزدوج', price: 3 }] },
            { id: 'cafe-cappuccino', cat: 'cafe-coffee', price: 3.5, featured: true, en: ['Cappuccino', 'Espresso with steamed milk foam'], ar: ['كابتشينو', 'إسبريسو مع رغوة الحليب'],
              variants: [{ id: 'regular', en: 'Regular', ar: 'عادي', price: 3.5 }, { id: 'large', en: 'Large', ar: 'كبير', price: 4.5 }] },
            { id: 'cafe-iced-latte', cat: 'cafe-coffee', price: 4, en: ['Iced latte', 'Espresso, cold milk and ice'], ar: ['لاتيه مثلّج', 'إسبريسو وحليب بارد وثلج'] },
            { id: 'cafe-knefeh', cat: 'cafe-sweets', price: 4, featured: true, en: ['Knefeh bi jebne', 'Warm cheese knefeh in sesame bread'], ar: ['كنافة بالجبنة', 'كنافة ساخنة بالجبنة في كعكة بالسمسم'] },
            { id: 'cafe-maamoul', cat: 'cafe-sweets', price: 6, en: ['Maamoul box (6 pieces)', 'Dates, walnuts and pistachio'], ar: ['علبة معمول (6 قطع)', 'تمر وجوز وفستق'] },
            { id: 'cafe-croissant-zaatar', cat: 'cafe-bakery', price: 2, en: ['Zaatar croissant', 'Flaky croissant with zaatar and olive oil'], ar: ['كرواسان زعتر', 'كرواسان مورّق بالزعتر وزيت الزيتون'] },
            { id: 'cafe-croissant-cheese', cat: 'cafe-bakery', price: 2.5, en: ['Cheese croissant', 'Filled with white cheese'], ar: ['كرواسان جبنة', 'محشو بالجبنة البيضاء'] },
        ],
    },
    {
        slug: 'demo-shop', id: 'demo-shop-001', module: 'shop', subType: 'gifts',
        name: { en: 'Souk Box', ar: 'صندوق السوق' },
        description: { en: 'Lebanese gifts and home goods. A Core Commerce demo shop.', ar: 'هدايا ومنتجات منزلية لبنانية. متجر تجريبي من Core Commerce.' },
        orderTypes: 'delivery,pickup', color: '#1F6F5C', hours: [10, 20], closedDays: ['Sunday'],
        deliveryNote: { en: 'Delivery across Lebanon in 1 to 3 days. We confirm the fee on WhatsApp.', ar: 'توصيل إلى كل لبنان خلال 1 إلى 3 أيام. نؤكد الرسم عبر واتساب.' },
        categories: [
            { id: 'shop-home', en: 'Home', ar: 'المنزل' },
            { id: 'shop-pantry', en: 'Pantry', ar: 'المؤونة' },
            { id: 'shop-accessories', en: 'Accessories', ar: 'إكسسوارات' },
        ],
        items: [
            { id: 'shop-candle', cat: 'shop-home', price: 14, compareAt: 18, stock: 4, featured: true, sku: 'HOM-CAN-01',
              en: ['Cedar candle', 'Hand-poured soy candle with a cedar scent'], ar: ['شمعة الأرز', 'شمعة صويا مصبوبة يدوياً برائحة الأرز'] },
            { id: 'shop-soap', cat: 'shop-home', price: 9, stock: 12, sku: 'HOM-SOA-03',
              en: ['Olive oil soap (pack of 3)', 'Traditional soap from olive oil'], ar: ['صابون زيت الزيتون (3 قطع)', 'صابون تقليدي من زيت الزيتون'] },
            { id: 'shop-cups', cat: 'shop-home', price: 16, stock: 7, sku: 'HOM-CUP-02',
              en: ['Coffee cups (set of 2)', 'Hand-painted ceramic'], ar: ['فناجين قهوة (طقم من 2)', 'سيراميك مرسوم يدوياً'],
              variants: [{ id: 'blue', en: 'Blue', ar: 'أزرق', price: 16 }, { id: 'white', en: 'White', ar: 'أبيض', price: 16 }] },
            { id: 'shop-zaatar', cat: 'shop-pantry', price: 6, stock: 25, sku: 'PAN-ZAA-250',
              en: ['Zaatar (250 g)', 'Mountain thyme, sumac and sesame'], ar: ['زعتر (250 غ)', 'زعتر جبلي وسماق وسمسم'] },
            { id: 'shop-molasses', cat: 'shop-pantry', price: 7, stock: 0, sku: 'PAN-MOL-01',
              en: ['Pomegranate molasses', 'Sold out for now: back soon'], ar: ['دبس الرمان', 'نفد حالياً، يعود قريباً'] },
            { id: 'shop-scarf', cat: 'shop-accessories', price: 25, stock: 3, sku: 'ACC-SCA-01',
              en: ['Embroidered scarf', 'Cotton with hand embroidery'], ar: ['وشاح مطرّز', 'قطن بتطريز يدوي'],
              variants: [{ id: 'red', en: 'Red', ar: 'أحمر', price: 25 }, { id: 'navy', en: 'Navy', ar: 'كحلي', price: 25 }] },
            { id: 'shop-tote', cat: 'shop-accessories', price: 12, sku: 'ACC-TOT-01',
              en: ['Tote bag', 'Canvas bag with a Beirut print'], ar: ['حقيبة قماش', 'حقيبة كانفاس برسمة بيروت'] },
        ],
    },
    {
        slug: 'demo-services', id: 'demo-services-001', module: 'services', subType: 'beauty',
        name: { en: 'Lina Beauty Studio', ar: 'ستوديو لينا للتجميل' },
        description: { en: 'Hair, nails and skin care. A Core Commerce demo services page.', ar: 'شعر وأظافر وعناية بالبشرة. صفحة خدمات تجريبية من Core Commerce.' },
        orderTypes: 'at_location,home_visit', color: '#9B2C6B', hours: [9, 19], closedDays: ['Sunday'],
        categories: [
            { id: 'svc-hair', en: 'Hair', ar: 'الشعر' },
            { id: 'svc-nails', en: 'Nails', ar: 'الأظافر' },
            { id: 'svc-skin', en: 'Skin care', ar: 'العناية بالبشرة' },
        ],
        items: [
            { id: 'svc-cut', cat: 'svc-hair', price: 20, minutes: 45, featured: true, en: ['Haircut and blow-dry', 'Wash, cut and styling'], ar: ['قص وسشوار', 'غسيل وقص وتسريح'] },
            { id: 'svc-colour', cat: 'svc-hair', price: 45, minutes: 120, en: ['Hair colour', 'Price depends on length'], ar: ['صبغة شعر', 'السعر حسب طول الشعر'],
              variants: [{ id: 'short', en: 'Short hair', ar: 'شعر قصير', price: 45 }, { id: 'long', en: 'Long hair', ar: 'شعر طويل', price: 65 }] },
            { id: 'svc-manicure', cat: 'svc-nails', price: 12, minutes: 40, en: ['Manicure', 'Shaping, care and polish'], ar: ['مانيكير', 'تشكيل وعناية وطلاء'] },
            { id: 'svc-pedicure', cat: 'svc-nails', price: 15, minutes: 50, en: ['Pedicure', 'Care and polish'], ar: ['باديكير', 'عناية وطلاء'] },
            { id: 'svc-facial', cat: 'svc-skin', price: 30, minutes: 60, en: ['Facial cleansing', 'Deep cleansing and a mask'], ar: ['تنظيف بشرة', 'تنظيف عميق وماسك'] },
        ],
    },
    {
        slug: 'demo-stays', id: 'demo-stays-001', module: 'stays', subType: 'guesthouse',
        name: { en: 'Beit Sama', ar: 'بيت سما' },
        description: { en: 'A stone guesthouse and sea chalets in Batroun. A Core Commerce demo stay.', ar: 'بيت ضيافة حجري وشاليهات على البحر في البترون. إقامة تجريبية من Core Commerce.' },
        orderTypes: 'stay', color: '#1F6F78', hours: [0, 24],
        stayConfig: { check_in: '14:00', check_out: '12:00', min_nights: 1, max_nights: 14, max_days: 365, deposit_percent: 30, blocked_dates: [] },
        categories: [
            { id: 'stay-rooms', en: 'Guesthouse rooms', ar: 'غرف بيت الضيافة' },
            { id: 'stay-chalets', en: 'Sea chalets', ar: 'شاليهات البحر' },
        ],
        items: [
            { id: 'stay-double', cat: 'stay-rooms', price: 90, weekend: 110, units: 3, guests: 2, featured: true,
              en: ['Double room', 'Stone walls, a double bed and a garden view. Breakfast included.'], ar: ['غرفة مزدوجة', 'جدران حجرية وسرير مزدوج وإطلالة على الحديقة. الفطور مشمول.'] },
            { id: 'stay-family', cat: 'stay-rooms', price: 130, weekend: 160, units: 1, guests: 4,
              en: ['Family room', 'A double bed and two singles. Breakfast included.'], ar: ['غرفة عائلية', 'سرير مزدوج وسريران مفردان. الفطور مشمول.'] },
            { id: 'stay-chalet', cat: 'stay-chalets', price: 180, weekend: 240, units: 2, guests: 5,
              en: ['Sea-view chalet', 'Two bedrooms, a kitchen and a terrace over the sea.'], ar: ['شاليه مطل على البحر', 'غرفتا نوم ومطبخ وتراس فوق البحر.'] },
        ],
    },
];

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

async function seed(demo: Demo) {
    const adminEmail = `${demo.slug}@example.com`;
    const adminPassword = process.env.DEMO_ADMIN_PASSWORD || randomBytes(12).toString('base64url');
    const passwordHash = await bcrypt.hash(adminPassword, 10);
    const now = new Date().toISOString();
    const nextYear = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
    const moduleDef = MODULES[demo.module];
    // Row ids are unique across all catalogs, so each demo prefixes its own
    const rowId = (id: string) => `${demo.slug}-${id}`;

    // Child tables first, so an old copy is fully removed even without ON DELETE CASCADE
    const old = await db.execute({ sql: 'SELECT id FROM catalogs WHERE slug = ?', args: [demo.slug] });
    const cleanup: InStatement[] = old.rows.flatMap((row) => [
        ...['orders', 'catalog_menu_versions', 'menu_items', 'categories', 'operating_hours', 'faqs', 'social_media', 'catalog_contact',
            'catalog_settings', 'catalog_admins', 'catalog_subscriptions'].map((table) => ({
            sql: `DELETE FROM ${table} WHERE catalog_id = ?`, args: [row.id as string],
        })),
        { sql: 'DELETE FROM catalogs WHERE id = ?', args: [row.id as string] },
    ]);

    const statements: InStatement[] = [
        ...cleanup,
        {
            sql: `INSERT INTO catalogs (id, slug, name, name_en, name_ar, name_fr, business_type, module, addons,
                    description, description_en, description_ar, description_fr, is_active, created_at, updated_at)
                  VALUES (?, ?, ?, ?, ?, '', ?, ?, ?, ?, ?, ?, '', 1, ?, ?)`,
            args: [demo.id, demo.slug, demo.name.en, demo.name.en, demo.name.ar, demo.subType, demo.module, moduleDef.defaultAddons.join(','),
                demo.description.en, demo.description.en, demo.description.ar, now, now],
        },
        {
            sql: `INSERT INTO catalog_subscriptions (id, catalog_id, subscription_type, starts_at, expires_at,
                    multi_language_enabled, booking_enabled, analytics_enabled,
                    ai_image_enhancement_limit, max_items, max_categories, is_active, created_at)
                  VALUES (?, ?, 'enterprise', ?, ?, 1, 0, 1, 0, 500, 50, 1, ?)`,
            args: [`${demo.id}-sub`, demo.id, now, nextYear, now],
        },
        {
            sql: `INSERT INTO catalog_settings (catalog_id, color_primary, enabled_languages, default_language,
                    currency_primary, lbp_exchange_rate, lbp_rate_updated_at, show_dual_currency, order_types,
                    delivery_note_en, delivery_note_ar, booking_enabled, whatsapp_order_enabled,
                    seo_title_en, seo_description_en, seo_title_ar, seo_description_ar)
                  VALUES (?, ?, 'ar,en', 'en', 'USD', ?, ?, 1, ?, ?, ?, ?, 1, ?, ?, ?, ?)`,
            args: [demo.id, demo.color, LBP_RATE, now, demo.orderTypes,
                demo.deliveryNote?.en ?? null, demo.deliveryNote?.ar ?? null, moduleDef.tableBooking ? 1 : 0,
                `${demo.name.en} · Core Commerce demo`, demo.description.en, `${demo.name.ar} · تجربة Core Commerce`, demo.description.ar],
        },
        {
            sql: `INSERT INTO catalog_contact (catalog_id, phone_primary, phone_whatsapp, email,
                    address_en, address_ar, address_fr, city_en, city_ar, city_fr, country_en, country_ar, country_fr)
                  VALUES (?, ?, ?, 'info@coredex.solutions', 'Demo address', 'عنوان تجريبي', '', 'Beirut', 'بيروت', '', 'Lebanon', 'لبنان', '')`,
            args: [demo.id, PHONE, PHONE],
        },
        {
            sql: `INSERT INTO catalog_admins (id, catalog_id, email, password_hash, name, role, is_active, created_at)
                  VALUES (?, ?, ?, ?, 'Demo Admin', 'admin', 1, ?)`,
            args: [`${demo.id}-admin`, demo.id, adminEmail, passwordHash, now],
        },
        ...demo.categories.map((cat, order) => ({
            sql: `INSERT INTO categories (id, catalog_id, name_en, name_ar, name_fr, display_order, is_active, created_at)
                  VALUES (?, ?, ?, ?, '', ?, 1, ?)`,
            args: [rowId(cat.id), demo.id, cat.en, cat.ar, order, now],
        })),
        ...demo.items.map((item, order) => ({
            sql: `INSERT INTO menu_items (id, catalog_id, category_id, name_en, name_ar, name_fr,
                    description_en, description_ar, description_fr, price, currency,
                    display_order, is_active, is_featured, is_available, variants,
                    stock_qty, sku, compare_at_price, duration_minutes, unit_count, max_guests, weekend_price, created_at)
                  VALUES (?, ?, ?, ?, ?, '', ?, ?, '', ?, 'USD', ?, 1, ?, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            args: [
                rowId(item.id), demo.id, rowId(item.cat), item.en[0], item.ar[0], item.en[1], item.ar[1], item.price,
                order, item.featured ? 1 : 0,
                item.variants ? JSON.stringify(item.variants.map((v) => ({ id: v.id, name_en: v.en, name_ar: v.ar, price: v.price }))) : null,
                item.stock ?? null, item.sku ?? null, item.compareAt ?? null, item.minutes ?? null,
                item.units ?? null, item.guests ?? null, item.weekend ?? null, now,
            ],
        })),
        ...(demo.stayConfig
            ? [{ sql: 'UPDATE catalog_settings SET stay_config = ? WHERE catalog_id = ?', args: [JSON.stringify(demo.stayConfig), demo.id] }]
            : []),
        ...DAYS.map((day) => ({
            sql: `INSERT INTO operating_hours (catalog_id, day_name, open_hour, close_hour, is_closed) VALUES (?, ?, ?, ?, ?)`,
            args: [demo.id, day, demo.hours[0], demo.hours[1], demo.closedDays?.includes(day) ? 1 : 0],
        })),
    ];

    // One transaction: the demo is either fully replaced or left as it was
    await db.batch(statements, 'write');
    await publishMenu(demo.id, adminEmail, 'Demo');

    console.log(`Created "${demo.slug}" (${moduleDef.label.en}): ${demo.categories.length} categories, ${demo.items.length} items`);
    console.log(`  Admin: ${adminEmail} / ${adminPassword}  (save this password; it is not stored anywhere else)`);
    console.log(`  Page: /c/${demo.slug}   Admin: /c/${demo.slug}/admin`);
}

(async () => {
    const only = process.env.DEMO_ONLY;
    for (const demo of DEMOS.filter((d) => !only || d.slug === only)) await seed(demo);
})().catch((error) => {
    console.error(error);
    process.exit(1);
});
