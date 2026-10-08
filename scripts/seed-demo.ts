// Script to seed a demo catalog with sample data
import * as dotenv from 'dotenv';
dotenv.config();

import { createClient } from '@libsql/client';
import bcrypt from 'bcryptjs';

const db = createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN,
});

async function seedDemo() {
    console.log('🚀 Seeding demo catalog...');

    const catalogId = 'demo-catalog-001';
    const adminId = 'demo-admin-001';
    const adminEmail = 'demo@primesteaks.com';
    const adminPassword = 'demo1234';
    const passwordHash = await bcrypt.hash(adminPassword, 10);

    const now = new Date().toISOString();
    const oneYearLater = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();

    // Check if demo already exists
    const existing = await db.execute({
        sql: 'SELECT id FROM catalogs WHERE slug = ?',
        args: ['demo'],
    });

    if (existing.rows.length > 0) {
        console.log('⚠️ Demo catalog already exists. Deleting and recreating...');
        // cascading delete will handle most related tables
        await db.execute({ sql: 'DELETE FROM catalogs WHERE slug = ?', args: ['demo'] });
    }

    // 1. Create Catalog
    await db.execute({
        sql: `INSERT INTO catalogs (id, slug, name, name_en, name_ar, name_fr, business_type, description, description_en, description_ar, description_fr, logo_url, is_active, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
        args: [
            catalogId,
            'demo',
            'Prime Steaks',
            'Prime Steaks',
            'برايم ستيكس',
            'Prime Steaks',
            'restaurant',
            'Experience the finest cuts of premium steaks, expertly prepared by our master chefs.',
            'Experience the finest cuts of premium steaks, expertly prepared by our master chefs.',
            'استمتع بأجود شرائح اللحم الفاخرة، المحضرة بخبرة من قبل طهاتنا المتميزين.',
            'Découvrez les meilleures coupes de steaks de qualité supérieure, préparées avec expertise par nos maîtres cuisiniers.',
            'https://images.unsplash.com/photo-1544025162-d76694265947?w=200&h=200&fit=crop',
            now,
            now,
        ],
    });
    console.log('✅ Created catalog');

    // 2. Create Subscription
    await db.execute({
        sql: `INSERT INTO catalog_subscriptions (
            id, catalog_id, subscription_type, starts_at, expires_at, 
            multi_language_enabled, booking_enabled, analytics_enabled,
            ai_image_enhancement_limit, max_items, max_categories, is_active, created_at
          ) VALUES (?, ?, ?, ?, ?, 1, 1, 1, 100, 500, 50, 1, ?)`,
        args: [
            'demo-sub-001',
            catalogId,
            'enterprise',
            now,
            oneYearLater,
            now,
        ],
    });
    console.log('✅ Created subscription');

    // 3. Create Settings
    await db.execute({
        sql: `INSERT INTO catalog_settings (
            catalog_id, color_primary, hero_image_url,
            enabled_languages, default_language,
            seo_title_en, seo_description_en, seo_title_ar, seo_description_ar
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
            catalogId,
            '#8B5CF6',
            'https://images.unsplash.com/photo-1600891964092-4316c288032e?w=1200&h=600&fit=crop',
            'en,ar',
            'en',
            'Prime Steaks | Premium Restaurant',
            'Experience world-class dining with our selection of premium Wagyu and dry-aged steaks.',
            'برايم ستيكس | مطعم فاخر',
            'استمتع بتجربة طعام عالمية مع مجموعتنا من ستيكات واغيو والستيكات المعتقة.',
        ],
    });
    console.log('✅ Created settings');

    // 4. Create Contact Info
    await db.execute({
        sql: `INSERT INTO catalog_contact (
            catalog_id, phone_primary, phone_whatsapp, email,
            address_en, address_ar, city_en, city_ar, country_en, country_ar
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
            catalogId,
            '+966540679669',
            '+966540679669',
            'reservations@primesteaks.com',
            'King Fahd Road, Olaya District',
            'طريق الملك فهد، حي العليا',
            'Riyadh',
            'الرياض',
            'Saudi Arabia',
            'المملكة العربية السعودية',
        ],
    });
    console.log('✅ Created contact info');

    // 4.5 Create Catalog Admin
    await db.execute({
        sql: `INSERT INTO catalog_admins (id, catalog_id, email, password_hash, name, role, is_active, created_at)
          VALUES (?, ?, ?, ?, ?, 'admin', 1, ?)`,
        args: [
            adminId,
            catalogId,
            adminEmail,
            passwordHash,
            'Demo Admin',
            now,
        ],
    });
    console.log(`✅ Created catalog admin: ${adminEmail} / ${adminPassword}`);

    // 5. Create Categories
    const categories = [
        { id: 'cat-steaks', name_en: 'Premium Steaks', name_ar: 'ستيكات فاخرة', name_fr: 'Steaks Premium', icon: 'Beef', order: 0 },
        { id: 'cat-sides', name_en: 'Sides', name_ar: 'أطباق جانبية', name_fr: 'Accompagnements', icon: 'Salad', order: 1 },
        { id: 'cat-appetizers', name_en: 'Appetizers', name_ar: 'مقبلات', name_fr: 'Entrées', icon: 'UtensilsCrossed', order: 2 },
        { id: 'cat-drinks', name_en: 'Beverages', name_ar: 'مشروبات', name_fr: 'Boissons', icon: 'Wine', order: 3 },
        { id: 'cat-desserts', name_en: 'Desserts', name_ar: 'حلويات', name_fr: 'Desserts', icon: 'Cake', order: 4 },
    ];

    for (const cat of categories) {
        await db.execute({
            sql: `INSERT INTO categories (id, catalog_id, name_en, name_ar, name_fr, icon_name, display_order, is_active, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)`,
            args: [cat.id, catalogId, cat.name_en, cat.name_ar, cat.name_fr, cat.icon, cat.order, now],
        });
    }
    console.log('✅ Created 5 categories');

    // 6. Create Items
    const items = [
        // Premium Steaks
        { id: 'item-001', cat: 'cat-steaks', name_en: 'Wagyu A5 Ribeye', name_ar: 'ريب آي واغيو A5', name_fr: 'Wagyu A5 Ribeye', price: 189, desc_en: 'Japanese A5 Wagyu, 12oz, served with truffle butter', desc_ar: 'واغيو ياباني درجة A5، 12 أونصة، مع زبدة الكمأة', desc_fr: 'Wagyu japonais A5, 12oz, servi avec beurre de truffe', img: 'https://images.unsplash.com/photo-1600891964092-4316c288032e?w=400&h=300&fit=crop', order: 0 },
        { id: 'item-002', cat: 'cat-steaks', name_en: 'Prime Filet Mignon', name_ar: 'فيليه مينيون برايم', name_fr: 'Filet Mignon Prime', price: 145, desc_en: 'USDA Prime, 10oz, butter-basted to perfection', desc_ar: 'لحم أمريكي درجة برايم، 10 أونصة، مطهو بالزبدة', desc_fr: 'USDA Prime, 10oz, cuit au beurre', img: 'https://images.unsplash.com/photo-1558030006-450675393462?w=400&h=300&fit=crop', order: 1 },
        { id: 'item-003', cat: 'cat-steaks', name_en: 'Tomahawk 32oz', name_ar: 'توماهوك 32 أونصة', name_fr: 'Tomahawk 32oz', price: 225, desc_en: 'Bone-in ribeye, dry-aged 45 days, for sharing', desc_ar: 'ريب آي بالعظم، معتق 45 يوم، للمشاركة', desc_fr: 'Côte de boeuf avec os, affinée 45 jours, à partager', img: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&h=300&fit=crop', order: 2 },
        { id: 'item-004', cat: 'cat-steaks', name_en: 'NY Strip', name_ar: 'نيويورك ستريب', name_fr: 'Faux-filet NY', price: 125, desc_en: 'Classic NY strip, 14oz, chargrilled', desc_ar: 'ستريب نيويورك كلاسيكي، 14 أونصة، مشوي على الفحم', desc_fr: 'Faux-filet classique NY, 14oz, grillé au charbon', img: 'https://images.unsplash.com/photo-1432139555190-58524dae6a55?w=400&h=300&fit=crop', order: 3 },

        // Sides
        { id: 'item-005', cat: 'cat-sides', name_en: 'Truffle Mashed Potatoes', name_ar: 'بطاطس مهروسة بالكمأة', name_fr: 'Purée à la Truffe', price: 18, desc_en: 'Creamy potatoes with black truffle oil', desc_ar: 'بطاطس كريمية مع زيت الكمأة السوداء', desc_fr: 'Pommes de terre crémeuses à l\'huile de truffe noire', img: 'https://images.unsplash.com/photo-1596560548464-f010549b84d7?w=400&h=300&fit=crop', order: 0 },
        { id: 'item-006', cat: 'cat-sides', name_en: 'Grilled Asparagus', name_ar: 'هليون مشوي', name_fr: 'Asperges Grillées', price: 16, desc_en: 'With parmesan and lemon zest', desc_ar: 'مع البارميزان وقشر الليمون', desc_fr: 'Avec parmesan et zeste de citron', img: 'https://images.unsplash.com/photo-1515516969-d4008cc6241a?w=400&h=300&fit=crop', order: 1 },
        { id: 'item-007', cat: 'cat-sides', name_en: 'Caesar Salad', name_ar: 'سلطة سيزر', name_fr: 'Salade César', price: 14, desc_en: 'Romaine, parmesan, house-made dressing', desc_ar: 'خس روماني، بارميزان، صلصة منزلية', desc_fr: 'Romaine, parmesan, vinaigrette maison', img: 'https://images.unsplash.com/photo-1550304943-4f24f54ddde9?w=400&h=300&fit=crop', order: 2 },

        // Appetizers
        { id: 'item-008', cat: 'cat-appetizers', name_en: 'Wagyu Tartare', name_ar: 'تارتار واغيو', name_fr: 'Tartare de Wagyu', price: 38, desc_en: 'Hand-cut wagyu with quail egg and caviar', desc_ar: 'واغيو مقطع يدوياً مع بيض السمان والكافيار', desc_fr: 'Wagyu coupé à la main avec oeuf de caille et caviar', img: 'https://images.unsplash.com/photo-1626645738196-c2a72c7d0e6a?w=400&h=300&fit=crop', order: 0 },
        { id: 'item-009', cat: 'cat-appetizers', name_en: 'Lobster Bisque', name_ar: 'شوربة اللوبستر', name_fr: 'Bisque de Homard', price: 28, desc_en: 'Rich cream soup with Maine lobster', desc_ar: 'شوربة كريمية غنية مع لوبستر', desc_fr: 'Soupe crémeuse riche au homard du Maine', img: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400&h=300&fit=crop', order: 1 },

        // Drinks
        { id: 'item-010', cat: 'cat-drinks', name_en: 'Signature Mocktail', name_ar: 'موكتيل خاص', name_fr: 'Mocktail Signature', price: 22, desc_en: 'Berry blend with fresh mint', desc_ar: 'مزيج التوت مع النعناع الطازج', desc_fr: 'Mélange de baies avec menthe fraîche', img: 'https://images.unsplash.com/photo-1551538827-9c037cb4f32a?w=400&h=300&fit=crop', order: 0 },
        { id: 'item-011', cat: 'cat-drinks', name_en: 'Fresh Orange Juice', name_ar: 'عصير برتقال طازج', name_fr: 'Jus d\'Orange Frais', price: 12, desc_en: 'Freshly squeezed', desc_ar: 'معصور طازجاً', desc_fr: 'Fraîchement pressé', img: 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=400&h=300&fit=crop', order: 1 },

        // Desserts
        { id: 'item-012', cat: 'cat-desserts', name_en: 'Chocolate Lava Cake', name_ar: 'كيك الشوكولاتة السائلة', name_fr: 'Fondant au Chocolat', price: 18, desc_en: 'Warm chocolate cake with vanilla ice cream', desc_ar: 'كيك شوكولاتة دافئ مع آيس كريم فانيلا', desc_fr: 'Gâteau au chocolat chaud avec glace vanille', img: 'https://images.unsplash.com/photo-1624353365286-3f8d62daad51?w=400&h=300&fit=crop', order: 0 },
        { id: 'item-013', cat: 'cat-desserts', name_en: 'Crème Brûlée', name_ar: 'كريم بروليه', name_fr: 'Crème Brûlée', price: 16, desc_en: 'Classic French custard with caramelized sugar', desc_ar: 'كاسترد فرنسي كلاسيكي مع سكر محروق', desc_fr: 'Crème classique française au sucre caramélisée', img: 'https://images.unsplash.com/photo-1470124182917-cc6e71b22ecc?w=400&h=300&fit=crop', order: 1 },
    ];

    for (const item of items) {
        await db.execute({
            sql: `INSERT INTO menu_items (
              id, catalog_id, category_id, name_en, name_ar, name_fr, description_en, description_ar, description_fr,
              price, image_url, display_order, is_active, is_featured, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
            args: [
                item.id, catalogId, item.cat, item.name_en, item.name_ar, item.name_fr,
                item.desc_en, item.desc_ar, item.desc_fr, item.price, item.img, item.order,
                item.order < 2 ? 1 : 0, // First 2 items in each category are featured
                now,
            ],
        });
    }
    console.log('✅ Created 13 menu items');

    // 7. Create Operating Hours
    const days = [
        { name: 'Monday', open: 12.0, close: 23.0 },
        { name: 'Tuesday', open: 12.0, close: 23.0 },
        { name: 'Wednesday', open: 12.0, close: 23.0 },
        { name: 'Thursday', open: 12.0, close: 23.0 },
        { name: 'Friday', open: 13.0, close: 23.0 },
        { name: 'Saturday', open: 12.0, close: 23.0 },
        { name: 'Sunday', open: 12.0, close: 23.0 },
    ];
    for (const day of days) {
        await db.execute({
            sql: `INSERT INTO operating_hours (catalog_id, day_name, open_hour, close_hour, is_closed)
            VALUES (?, ?, ?, ?, ?)`,
            args: [
                catalogId,
                day.name,
                day.open,
                day.close,
                0,
            ],
        });
    }
    console.log('✅ Created operating hours');

    // 8. Create Branches
    await db.execute({
        sql: `INSERT INTO branches (id, catalog_id, name_en, name_ar, name_fr, address_en, address_ar, address_fr, phone_numbers, map_url, display_order, is_active)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
        args: [
            'demo-branch-001',
            catalogId,
            'Main Branch - Riyadh',
            'الفرع الرئيسي - الرياض',
            'Siège Social - Riyad',
            'King Fahd Road, Olaya District, Riyadh',
            'طريق الملك فهد، حي العليا، الرياض',
            'Route King Fahd, Quartier Olaya, Riyad',
            JSON.stringify(['+966540679669']),
            'https://maps.google.com/?q=24.7136,46.6753',
            0,
        ],
    });
    console.log('✅ Created branch');

    // 9. Create FAQs
    const faqs = [
        { q_en: 'Do you accept reservations?', a_en: 'Yes! We highly recommend making reservations, especially for weekend dinners. You can book via WhatsApp or phone.', q_ar: 'هل تقبلون الحجوزات؟', a_ar: 'نعم! نوصي بشدة بالحجز المسبق، خاصة لعشاء نهاية الأسبوع. يمكنك الحجز عبر الواتساب أو الهاتف.', q_fr: 'Acceptez-vous les réservations?', a_fr: 'Oui! Nous recommandons vivement de réserver, surtout pour les dîners du week-end. Vous pouvez réserver via WhatsApp ou par téléphone.' },
        { q_en: 'What payment methods do you accept?', a_en: 'We accept all major credit cards, Apple Pay, and cash.', q_ar: 'ما هي طرق الدفع المقبولة؟', a_ar: 'نقبل جميع بطاقات الائتمان الرئيسية، وأبل باي، والنقد.', q_fr: 'Quels modes de paiement acceptez-vous?', a_fr: 'Nous acceptons toutes les principales cartes de crédit, Apple Pay et les espèces.' },
        { q_en: 'Is there parking available?', a_en: 'Yes, we have complimentary valet parking for all our guests.', q_ar: 'هل يتوفر موقف سيارات؟', a_ar: 'نعم، لدينا خدمة صف السيارات المجانية لجميع ضيوفنا.', q_fr: 'Un parking est-il disponible?', a_fr: 'Oui, nous disposons d\'un service de voiturier gratuit pour tous nos clients.' },
    ];

    for (let i = 0; i < faqs.length; i++) {
        await db.execute({
            sql: `INSERT INTO faqs (id, catalog_id, question_en, answer_en, question_ar, answer_ar, question_fr, answer_fr, display_order, is_active)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
            args: [`demo-faq-${i}`, catalogId, faqs[i].q_en, faqs[i].a_en, faqs[i].q_ar, faqs[i].a_ar, faqs[i].q_fr, faqs[i].a_fr, i],
        });
    }
    console.log('✅ Created 3 FAQs');

    console.log('\n🎉 Demo catalog seeded successfully!');
    console.log('📍 Visit: http://localhost:3000/c/demo');
}

seedDemo().catch(console.error);
