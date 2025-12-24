/**
 * Seed data templates for different business types
 * 
 * When a new catalog is created, these templates can be used to
 * pre-populate with sample categories and items based on business type.
 */

import type { BusinessType } from '../db/types';

interface SeedCategory {
  name_ar: string;
  name_en: string;
  name_fr: string;
  icon_name: string;
  items: SeedItem[];
}

interface SeedItem {
  name_ar: string;
  name_en: string;
  name_fr: string;
  description_en?: string;
  price: number;
}

// ============================================
// Restaurant Template
// ============================================
const restaurantTemplate: SeedCategory[] = [
  {
    name_ar: 'المقبلات',
    name_en: 'Appetizers',
    name_fr: 'Entrées',
    icon_name: 'Salad',
    items: [
      { name_ar: 'حمص', name_en: 'Hummus', name_fr: 'Houmous', description_en: 'Creamy chickpea dip with olive oil', price: 8 },
      { name_ar: 'فتوش', name_en: 'Fattoush', name_fr: 'Fattouch', description_en: 'Fresh vegetable salad with pita chips', price: 10 },
      { name_ar: 'تبولة', name_en: 'Tabbouleh', name_fr: 'Taboulé', description_en: 'Parsley and bulgur salad', price: 9 },
    ],
  },
  {
    name_ar: 'الأطباق الرئيسية',
    name_en: 'Main Courses',
    name_fr: 'Plats Principaux',
    icon_name: 'Utensils',
    items: [
      { name_ar: 'مشاوي مشكلة', name_en: 'Mixed Grill', name_fr: 'Grillade Mixte', description_en: 'Assorted grilled meats', price: 25 },
      { name_ar: 'كباب', name_en: 'Kebab', name_fr: 'Kebab', description_en: 'Grilled minced meat skewers', price: 18 },
      { name_ar: 'شاورما', name_en: 'Shawarma', name_fr: 'Chawarma', description_en: 'Marinated sliced meat', price: 15 },
    ],
  },
  {
    name_ar: 'المشروبات',
    name_en: 'Beverages',
    name_fr: 'Boissons',
    icon_name: 'Wine',
    items: [
      { name_ar: 'عصير برتقال', name_en: 'Orange Juice', name_fr: 'Jus d\'Orange', description_en: 'Fresh squeezed', price: 5 },
      { name_ar: 'شاي', name_en: 'Tea', name_fr: 'Thé', description_en: 'Traditional tea', price: 3 },
      { name_ar: 'قهوة عربية', name_en: 'Arabic Coffee', name_fr: 'Café Arabe', description_en: 'Traditional cardamom coffee', price: 4 },
    ],
  },
  {
    name_ar: 'الحلويات',
    name_en: 'Desserts',
    name_fr: 'Desserts',
    icon_name: 'Cake',
    items: [
      { name_ar: 'بقلاوة', name_en: 'Baklava', name_fr: 'Baklava', description_en: 'Layered pastry with nuts and honey', price: 7 },
      { name_ar: 'كنافة', name_en: 'Kunafa', name_fr: 'Kunafa', description_en: 'Sweet cheese pastry', price: 8 },
    ],
  },
];

// ============================================
// Cafe Template
// ============================================
const cafeTemplate: SeedCategory[] = [
  {
    name_ar: 'القهوة',
    name_en: 'Coffee',
    name_fr: 'Café',
    icon_name: 'Coffee',
    items: [
      { name_ar: 'اسبريسو', name_en: 'Espresso', name_fr: 'Espresso', description_en: 'Single shot', price: 3 },
      { name_ar: 'كابتشينو', name_en: 'Cappuccino', name_fr: 'Cappuccino', description_en: 'Espresso with steamed milk', price: 5 },
      { name_ar: 'لاتيه', name_en: 'Latte', name_fr: 'Latte', description_en: 'Espresso with milk', price: 5 },
      { name_ar: 'موكا', name_en: 'Mocha', name_fr: 'Moka', description_en: 'Espresso with chocolate and milk', price: 6 },
    ],
  },
  {
    name_ar: 'الشاي',
    name_en: 'Tea',
    name_fr: 'Thé',
    icon_name: 'Leaf',
    items: [
      { name_ar: 'شاي أخضر', name_en: 'Green Tea', name_fr: 'Thé Vert', price: 4 },
      { name_ar: 'شاي بالنعناع', name_en: 'Mint Tea', name_fr: 'Thé à la Menthe', price: 4 },
      { name_ar: 'شاي إنجليزي', name_en: 'English Breakfast', name_fr: 'Thé Anglais', price: 4 },
    ],
  },
  {
    name_ar: 'المعجنات',
    name_en: 'Pastries',
    name_fr: 'Pâtisseries',
    icon_name: 'Cookie',
    items: [
      { name_ar: 'كرواسون', name_en: 'Croissant', name_fr: 'Croissant', price: 4 },
      { name_ar: 'مافن', name_en: 'Muffin', name_fr: 'Muffin', price: 4 },
      { name_ar: 'كيك الجزر', name_en: 'Carrot Cake', name_fr: 'Gâteau aux Carottes', price: 6 },
    ],
  },
];

// ============================================
// Retail Template
// ============================================
const retailTemplate: SeedCategory[] = [
  {
    name_ar: 'المنتجات الجديدة',
    name_en: 'New Arrivals',
    name_fr: 'Nouveautés',
    icon_name: 'Sparkles',
    items: [
      { name_ar: 'منتج 1', name_en: 'Product 1', name_fr: 'Produit 1', description_en: 'Latest collection item', price: 49 },
      { name_ar: 'منتج 2', name_en: 'Product 2', name_fr: 'Produit 2', description_en: 'Trending item', price: 59 },
    ],
  },
  {
    name_ar: 'الأكثر مبيعاً',
    name_en: 'Best Sellers',
    name_fr: 'Meilleures Ventes',
    icon_name: 'TrendingUp',
    items: [
      { name_ar: 'الأكثر مبيعاً 1', name_en: 'Best Seller 1', name_fr: 'Best-seller 1', description_en: 'Customer favorite', price: 39 },
      { name_ar: 'الأكثر مبيعاً 2', name_en: 'Best Seller 2', name_fr: 'Best-seller 2', description_en: 'Top rated', price: 45 },
    ],
  },
  {
    name_ar: 'العروض',
    name_en: 'Sale',
    name_fr: 'Soldes',
    icon_name: 'Tag',
    items: [
      { name_ar: 'عرض خاص 1', name_en: 'Sale Item 1', name_fr: 'Article en Solde 1', description_en: '30% off', price: 25 },
      { name_ar: 'عرض خاص 2', name_en: 'Sale Item 2', name_fr: 'Article en Solde 2', description_en: '40% off', price: 20 },
    ],
  },
];

// ============================================
// Salon Template
// ============================================
const salonTemplate: SeedCategory[] = [
  {
    name_ar: 'الشعر',
    name_en: 'Hair Services',
    name_fr: 'Services Capillaires',
    icon_name: 'Scissors',
    items: [
      { name_ar: 'قص شعر', name_en: 'Haircut', name_fr: 'Coupe de Cheveux', price: 30 },
      { name_ar: 'صبغة', name_en: 'Hair Color', name_fr: 'Coloration', price: 60 },
      { name_ar: 'تسريحة', name_en: 'Styling', name_fr: 'Coiffure', price: 40 },
    ],
  },
  {
    name_ar: 'العناية بالبشرة',
    name_en: 'Skin Care',
    name_fr: 'Soins de la Peau',
    icon_name: 'Sparkles',
    items: [
      { name_ar: 'تنظيف بشرة', name_en: 'Facial', name_fr: 'Soin du Visage', price: 50 },
      { name_ar: 'تقشير', name_en: 'Exfoliation', name_fr: 'Exfoliation', price: 40 },
    ],
  },
  {
    name_ar: 'الأظافر',
    name_en: 'Nail Services',
    name_fr: 'Services des Ongles',
    icon_name: 'Hand',
    items: [
      { name_ar: 'مناكير', name_en: 'Manicure', name_fr: 'Manucure', price: 25 },
      { name_ar: 'باديكير', name_en: 'Pedicure', name_fr: 'Pédicure', price: 30 },
    ],
  },
];

// ============================================
// Bakery Template
// ============================================
const bakeryTemplate: SeedCategory[] = [
  {
    name_ar: 'الخبز',
    name_en: 'Breads',
    name_fr: 'Pains',
    icon_name: 'Croissant',
    items: [
      { name_ar: 'خبز فرنسي', name_en: 'Baguette', name_fr: 'Baguette', price: 3 },
      { name_ar: 'خبز القمح', name_en: 'Wheat Bread', name_fr: 'Pain de Blé', price: 4 },
      { name_ar: 'خبز الزيتون', name_en: 'Olive Bread', name_fr: 'Pain aux Olives', price: 5 },
    ],
  },
  {
    name_ar: 'الكيك',
    name_en: 'Cakes',
    name_fr: 'Gâteaux',
    icon_name: 'Cake',
    items: [
      { name_ar: 'كيك شوكولاتة', name_en: 'Chocolate Cake', name_fr: 'Gâteau au Chocolat', price: 25 },
      { name_ar: 'تشيز كيك', name_en: 'Cheesecake', name_fr: 'Cheesecake', price: 22 },
      { name_ar: 'كيك الفراولة', name_en: 'Strawberry Cake', name_fr: 'Gâteau aux Fraises', price: 24 },
    ],
  },
  {
    name_ar: 'الحلويات',
    name_en: 'Pastries',
    name_fr: 'Pâtisseries',
    icon_name: 'Cookie',
    items: [
      { name_ar: 'كرواسون', name_en: 'Croissant', name_fr: 'Croissant', price: 4 },
      { name_ar: 'دانيش', name_en: 'Danish', name_fr: 'Danois', price: 4 },
      { name_ar: 'إكلير', name_en: 'Eclair', name_fr: 'Éclair', price: 5 },
    ],
  },
];

// ============================================
// Generic Template (for 'other')
// ============================================
const genericTemplate: SeedCategory[] = [
  {
    name_ar: 'الفئة الأولى',
    name_en: 'Category 1',
    name_fr: 'Catégorie 1',
    icon_name: 'Folder',
    items: [
      { name_ar: 'منتج 1', name_en: 'Product 1', name_fr: 'Produit 1', price: 10 },
      { name_ar: 'منتج 2', name_en: 'Product 2', name_fr: 'Produit 2', price: 15 },
    ],
  },
  {
    name_ar: 'الفئة الثانية',
    name_en: 'Category 2',
    name_fr: 'Catégorie 2',
    icon_name: 'Folder',
    items: [
      { name_ar: 'منتج 3', name_en: 'Product 3', name_fr: 'Produit 3', price: 20 },
      { name_ar: 'منتج 4', name_en: 'Product 4', name_fr: 'Produit 4', price: 25 },
    ],
  },
];

// ============================================
// Export Template Getter
// ============================================

export function getSeedTemplate(businessType: BusinessType): SeedCategory[] {
  switch (businessType) {
    case 'restaurant':
      return restaurantTemplate;
    case 'cafe':
      return cafeTemplate;
    case 'retail':
      return retailTemplate;
    case 'salon':
      return salonTemplate;
    case 'bakery':
      return bakeryTemplate;
    default:
      return genericTemplate;
  }
}

export type { SeedCategory, SeedItem };

