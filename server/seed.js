require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const VendorProfile = require('./models/VendorProfile');
const Product = require('./models/Product');
const Cart = require('./models/Cart');
const Order = require('./models/Order');
const SubOrder = require('./models/SubOrder');
const PaymentSplit = require('./models/PaymentSplit');
const Review = require('./models/Review');
const Coupon = require('./models/Coupon');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/marketplace';

// ─── Vendor Data ───────────────────────────────────────────────────────────────
const vendorsData = [
  {
    name: 'TechNova Electronics',
    email: 'technova@marketplace.com',
    storeName: 'TechNova Electronics',
    storeDescription: 'Premium electronics and gadgets from top global brands. Authorized dealer for Apple, Samsung, Sony, and more.',
    category: 'Electronics',
    logo: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=300&h=300&fit=crop&q=80',
    banner: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&h=400&fit=crop&q=80',
    commissionRate: 8,
    rating: 4.8,
    totalSales: 1250,
    gstNumber: 'GST29AAACT2727Q1ZW',
  },
  {
    name: 'StyleForward Fashion',
    email: 'styleforward@marketplace.com',
    storeName: 'StyleForward Fashion',
    storeDescription: 'Trendsetting fashion for men, women, and kids. Latest runway styles at direct-to-consumer prices.',
    category: 'Fashion',
    logo: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=300&h=300&fit=crop&q=80',
    banner: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=1200&h=400&fit=crop&q=80',
    commissionRate: 12,
    rating: 4.5,
    totalSales: 3400,
    gstNumber: 'GST27AABCS1429B1Z4',
  },
  {
    name: 'HomeBliss Furniture',
    email: 'homebliss@marketplace.com',
    storeName: 'HomeBliss Furniture',
    storeDescription: 'Elevate your living spaces with handcrafted solid wood furniture, bespoke décor, and ergonomic living solutions.',
    category: 'Home & Living',
    logo: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=300&h=300&fit=crop&q=80',
    banner: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1200&h=400&fit=crop&q=80',
    commissionRate: 10,
    rating: 4.6,
    totalSales: 890,
    gstNumber: 'GST24AAABH1234C1Z1',
  },
  {
    name: 'FitLife Sports',
    email: 'fitlife@marketplace.com',
    storeName: 'FitLife Sports',
    storeDescription: 'Your premier destination for professional sports equipment, high-performance activewear, and workout gear.',
    category: 'Sports & Fitness',
    logo: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=300&h=300&fit=crop&q=80',
    banner: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1200&h=400&fit=crop&q=80',
    commissionRate: 9,
    rating: 4.7,
    totalSales: 2100,
    gstNumber: 'GST07AACCF1122D1Z5',
  },
  {
    name: 'GourmetKart Foods',
    email: 'gourmetkart@marketplace.com',
    storeName: 'GourmetKart Foods',
    storeDescription: 'Artisanal pantry staples, cold-pressed oils, exotic spices, and luxury confectionery curated globally.',
    category: 'Food & Gourmet',
    logo: 'https://images.unsplash.com/photo-1506617564039-2f3b650b7010?w=300&h=300&fit=crop&q=80',
    banner: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=1200&h=400&fit=crop&q=80',
    commissionRate: 15,
    rating: 4.4,
    totalSales: 5600,
    gstNumber: 'GST19AABCG5678E1Z2',
  },
  {
    name: 'BeautyBloom Cosmetics',
    email: 'beautybloom@marketplace.com',
    storeName: 'BeautyBloom Cosmetics',
    storeDescription: 'Clean beauty, dermatologically tested serums, luxury fragrances, and holistic personal care essentials.',
    category: 'Beauty & Personal Care',
    logo: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=300&h=300&fit=crop&q=80',
    banner: 'https://images.unsplash.com/photo-1576426863848-c21f53c60b19?w=1200&h=400&fit=crop&q=80',
    commissionRate: 11,
    rating: 4.9,
    totalSales: 7800,
    gstNumber: 'GST09AAABH9012F1Z9',
  },
];

// ─── Product Data (30+ products across categories) ──────────────────────────
const productsData = [
  // Electronics (TechNova)
  {
    vendorIndex: 0,
    name: 'Apple iPhone 15 Pro Max 256GB Titanium',
    description: 'The definitive flagship iPhone. Aerospace-grade titanium body, revolutionary A17 Pro 3nm chipset, customizable Action Button, and 5x optical telephoto lens.',
    price: 134900,
    comparePrice: 159900,
    category: 'Electronics',
    subcategory: 'Smartphones',
    tags: ['apple', 'iphone', 'flagship', '5g', 'titanium'],
    images: [
      { url: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800&fit=crop&q=80', isPrimary: true },
      { url: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800&fit=crop&q=80' },
    ],
    stock: 45,
    sku: 'APPL-IP15PM-256',
    weight: 221,
    isFeatured: true,
    attributes: { brand: 'Apple', storage: '256GB', color: 'Natural Titanium', connectivity: '5G' },
    shippingInfo: { isFreeShipping: true, estimatedDays: 2 },
  },
  {
    vendorIndex: 0,
    name: 'Samsung Galaxy S24 Ultra AI Smartphone 512GB',
    description: 'Transform productivity with Galaxy AI: Circle to Search, Live Call Translation, Note Assist, 200MP Quad Tele System, and integrated S Pen in a sleek titanium frame.',
    price: 129999,
    comparePrice: 149999,
    category: 'Electronics',
    subcategory: 'Smartphones',
    tags: ['samsung', 'galaxy', 'ai', '5g', 'spen'],
    images: [
      { url: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=800&fit=crop&q=80', isPrimary: true },
    ],
    stock: 30,
    sku: 'SMSG-S24U-512',
    weight: 232,
    isFeatured: true,
    attributes: { brand: 'Samsung', storage: '512GB', color: 'Titanium Gray', connectivity: '5G' },
    shippingInfo: { isFreeShipping: true, estimatedDays: 2 },
  },
  {
    vendorIndex: 0,
    name: 'Sony WH-1000XM5 Wireless Noise-Canceling Headphones',
    description: 'Industry-standard active noise cancellation powered by dual processors and 8 microphones. Precise voice pickup, Hi-Res wireless audio, and 30-hour battery life.',
    price: 29990,
    comparePrice: 34990,
    category: 'Electronics',
    subcategory: 'Audio',
    tags: ['sony', 'anc', 'headphones', 'bluetooth', 'audiophile'],
    images: [
      { url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&fit=crop&q=80', isPrimary: true },
    ],
    stock: 85,
    sku: 'SONY-WHXM5-BLK',
    weight: 250,
    isFeatured: true,
    attributes: { brand: 'Sony', color: 'Silver', batteryLife: '30h', anc: 'Dual-Chip' },
    shippingInfo: { isFreeShipping: true, estimatedDays: 3 },
  },
  {
    vendorIndex: 0,
    name: 'Apple MacBook Air 13" M3 Chip 512GB',
    description: 'Impossibly thin and fast. Liquid Retina display, up to 18 hours of battery life, dual external display support, and MagSafe 3 charging in iconic Midnight aluminum.',
    price: 114900,
    comparePrice: 134900,
    category: 'Electronics',
    subcategory: 'Laptops',
    tags: ['apple', 'macbook', 'm3', 'laptop', 'lightweight'],
    images: [
      { url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&fit=crop&q=80', isPrimary: true },
    ],
    stock: 20,
    sku: 'APPL-MBA-M3-13',
    weight: 1240,
    isFeatured: true,
    attributes: { brand: 'Apple', ram: '8GB Unified', storage: '512GB SSD', screen: '13.6-inch' },
    shippingInfo: { isFreeShipping: true, estimatedDays: 3 },
  },
  {
    vendorIndex: 0,
    name: 'LG C3 55-inch 4K OLED Smart TV',
    description: 'Self-lit OLED pixels for infinite contrast, α9 AI Processor Gen6, 120Hz refresh rate, Dolby Vision IQ, and Dolby Atmos cinematic sound experience.',
    price: 139990,
    comparePrice: 179990,
    category: 'Electronics',
    subcategory: 'Televisions',
    tags: ['lg', 'oled', 'smarttv', '4k', 'gaming'],
    images: [
      { url: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=800&fit=crop&q=80', isPrimary: true },
    ],
    stock: 12,
    sku: 'LG-OLED55-C3',
    weight: 16000,
    isFeatured: false,
    attributes: { brand: 'LG', size: '55-inch', resolution: '4K UHD', refreshRate: '120Hz' },
    shippingInfo: { isFreeShipping: true, estimatedDays: 5 },
  },
  {
    vendorIndex: 0,
    name: 'Apple iPad Air 11-inch M2 Wi-Fi 128GB',
    description: 'Redesigned iPad Air driven by the M2 chip. Incredible Liquid Retina display, landscape 12MP Ultra Wide front camera with Center Stage, and Wi-Fi 6E.',
    price: 59900,
    comparePrice: 64900,
    category: 'Electronics',
    subcategory: 'Tablets',
    tags: ['apple', 'ipad', 'm2', 'tablet'],
    images: [
      { url: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800&fit=crop&q=80', isPrimary: true },
    ],
    stock: 35,
    sku: 'APPL-IPAD-AIR-M2',
    weight: 462,
    isFeatured: false,
    attributes: { brand: 'Apple', storage: '128GB', chip: 'M2', color: 'Starlight' },
    shippingInfo: { isFreeShipping: true, estimatedDays: 2 },
  },

  // Fashion (StyleForward)
  {
    vendorIndex: 1,
    name: 'Men\'s Italian Wool Tailored Slim-Fit Blazer',
    description: 'Bespoke tailoring crafted in pure Italian wool blend. Structured shoulders, double back vents, horn buttons, and contrast silk pick stitching on the lapels.',
    price: 4999,
    comparePrice: 8999,
    category: 'Fashion',
    subcategory: "Men's Wear",
    tags: ['blazer', 'formal', 'menswear', 'wool', 'tailored'],
    images: [
      { url: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800&fit=crop&q=80', isPrimary: true },
    ],
    stock: 120,
    sku: 'SF-BLAZER-WOOL-NVY',
    isFeatured: true,
    attributes: { material: 'Italian Wool Blend', fit: 'Slim Fit', color: 'Midnight Navy', dryClean: 'Yes' },
    shippingInfo: { isFreeShipping: true, estimatedDays: 4 },
  },
  {
    vendorIndex: 1,
    name: 'Women\'s French Chiffon Tiered Maxi Dress',
    description: 'Ethereal garden-party maxi dress in airy French chiffon with subtle metallic thread detail. Halter neck, defined smocked waist, and cascading ruffle tiers.',
    price: 2499,
    comparePrice: 4499,
    category: 'Fashion',
    subcategory: "Women's Wear",
    tags: ['dress', 'maxi', 'chiffon', 'floral', 'summer'],
    images: [
      { url: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800&fit=crop&q=80', isPrimary: true },
    ],
    stock: 90,
    sku: 'SF-DRESS-CHIFFON-MAXI',
    isFeatured: true,
    attributes: { material: 'French Chiffon', pattern: 'Botanical Floral', length: 'Maxi' },
    shippingInfo: { isFreeShipping: true, estimatedDays: 3 },
  },
  {
    vendorIndex: 1,
    name: 'Retro Classic White Streetwear Leather Sneakers',
    description: 'Minimalist unisex tennis sneakers handcrafted from full-grain calfskin leather with vulcanized gum rubber cupsoles and Ortholite memory foam footbeds.',
    price: 3499,
    comparePrice: 5999,
    category: 'Fashion',
    subcategory: 'Footwear',
    tags: ['sneakers', 'leather', 'unisex', 'minimalist', 'white-shoes'],
    images: [
      { url: 'https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=800&fit=crop&q=80', isPrimary: true },
    ],
    stock: 150,
    sku: 'SF-SNKR-CALF-WHT',
    isFeatured: false,
    attributes: { upper: 'Full-Grain Calfskin', sole: 'Vulcanized Rubber', closure: 'Lace-Up' },
    shippingInfo: { isFreeShipping: true, estimatedDays: 4 },
  },
  {
    vendorIndex: 1,
    name: 'Handcrafted Vegetable-Tanned Leather Tote Bag',
    description: 'Spacious everyday tote cut from rich vegetable-tanned leather that patinas gracefully with age. Padded 15" laptop sleeve, brass hardware, and key leash.',
    price: 3899,
    comparePrice: 6500,
    category: 'Fashion',
    subcategory: 'Accessories',
    tags: ['tote', 'leather', 'handbag', 'laptop-bag', 'luxury'],
    images: [
      { url: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&fit=crop&q=80', isPrimary: true },
    ],
    stock: 40,
    sku: 'SF-TOTE-VEG-TAN',
    isFeatured: false,
    attributes: { leather: 'Vegetable-Tanned Cowhide', capacity: '15L', hardware: 'Antique Brass' },
    shippingInfo: { isFreeShipping: true, estimatedDays: 3 },
  },
  {
    vendorIndex: 1,
    name: 'Classic Polarized Aviator Sunglasses - 24K Gold Frame',
    description: 'Timeless tear-drop aviator sunglasses featuring ultra-durable titanium frames plated in 24K gold, green polarized lenses offering 100% UVA/UVB protection.',
    price: 1799,
    comparePrice: 2999,
    category: 'Fashion',
    subcategory: 'Accessories',
    tags: ['sunglasses', 'aviator', 'polarized', 'gold', 'eyewear'],
    images: [
      { url: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800&fit=crop&q=80', isPrimary: true },
    ],
    stock: 80,
    sku: 'SF-AVT-GOLD-POL',
    isFeatured: false,
    attributes: { frame: 'Titanium Gold-Plated', lens: 'Polarized TAC', uvRating: 'UV400' },
    shippingInfo: { isFreeShipping: true, estimatedDays: 3 },
  },

  // Home & Living (HomeBliss)
  {
    vendorIndex: 2,
    name: 'Nordic Solid Teak Wood Round Coffee Table',
    description: 'Mid-century Scandinavian design sculpted from sustainably harvested plantation teak. Fluted solid timber pedestal base with water-resistant matte satin seal.',
    price: 15999,
    comparePrice: 24999,
    category: 'Home & Living',
    subcategory: 'Furniture',
    tags: ['furniture', 'table', 'teak', 'scandinavian', 'living-room'],
    images: [
      { url: 'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?w=800&fit=crop&q=80', isPrimary: true },
    ],
    stock: 25,
    sku: 'HB-TABLE-TEAK-RND',
    weight: 18000,
    isFeatured: true,
    attributes: { wood: 'Plantation Teak', diameter: '85cm', height: '45cm' },
    shippingInfo: { isFreeShipping: true, estimatedDays: 6 },
  },
  {
    vendorIndex: 2,
    name: '1000 Thread Count Egyptian Cotton Sateen Bedding Set',
    description: 'Hotel luxury at home. Loomed from 100% extra-long staple Giza Egyptian cotton in a silky 1000 TC sateen weave. Includes 1 duvet cover, 1 fitted sheet, 2 pillowcases.',
    price: 3999,
    comparePrice: 6999,
    category: 'Home & Living',
    subcategory: 'Bedding',
    tags: ['bedding', 'egyptian-cotton', 'sateen', 'luxury', 'sheets'],
    images: [
      { url: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800&fit=crop&q=80', isPrimary: true },
    ],
    stock: 65,
    sku: 'HB-BED-GIZA-1000',
    isFeatured: false,
    attributes: { material: '100% Giza Egyptian Cotton', threadCount: 1000, size: 'King' },
    shippingInfo: { isFreeShipping: true, estimatedDays: 3 },
  },
  {
    vendorIndex: 2,
    name: 'Ceramic Ultrasonic Aromatherapy Diffuser & 6 Oils',
    description: 'Hand-thrown matte white ceramic stone diffuser with ambient warm-glow LED. Ultrasonic cold-mist technology paired with 6 certified pure therapeutic essential oils.',
    price: 1899,
    comparePrice: 2999,
    category: 'Home & Living',
    subcategory: 'Home Décor',
    tags: ['diffuser', 'aromatherapy', 'essential-oils', 'ceramic', 'wellness'],
    images: [
      { url: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=800&fit=crop&q=80', isPrimary: true },
    ],
    stock: 110,
    sku: 'HB-DIFF-STONE-WHT',
    isFeatured: false,
    attributes: { capacity: '300ml', coverage: '500 sq ft', runtime: '10 hours' },
    shippingInfo: { isFreeShipping: true, estimatedDays: 4 },
  },
  {
    vendorIndex: 2,
    name: 'Cast Iron Dutch Oven 5.5 Quart Enamel Finish',
    description: 'Heavyweight enameled cast iron braiser that delivers superior heat retention and uniform heating. Self-basting lid condensation rings, oven-safe up to 260°C.',
    price: 4499,
    comparePrice: 7999,
    category: 'Home & Living',
    subcategory: 'Kitchen & Dining',
    tags: ['cookware', 'dutch-oven', 'cast-iron', 'enameled', 'kitchen'],
    images: [
      { url: 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=800&fit=crop&q=80', isPrimary: true },
    ],
    stock: 40,
    sku: 'HB-DUTCH-OVEN-55',
    weight: 6200,
    isFeatured: true,
    attributes: { capacity: '5.5 Quart', material: 'Enameled Cast Iron', color: 'Cobalt Blue' },
    shippingInfo: { isFreeShipping: true, estimatedDays: 4 },
  },
  {
    vendorIndex: 2,
    name: 'Handwoven Jute & Cotton Geometric Area Rug 5x8 ft',
    description: 'Textured natural organic jute interlocked with soft ivory recycled cotton yarns. Reversible, biodegradable, artisanal bohemian aesthetic.',
    price: 3299,
    comparePrice: 5499,
    category: 'Home & Living',
    subcategory: 'Home Décor',
    tags: ['rug', 'jute', 'handwoven', 'boho', 'sustainable'],
    images: [
      { url: 'https://images.unsplash.com/photo-1600121848594-d8644e57abab?w=800&fit=crop&q=80', isPrimary: true },
    ],
    stock: 30,
    sku: 'HB-RUG-JUTE-5X8',
    isFeatured: false,
    attributes: { dimensions: '5x8 feet', weave: 'Flatweave', material: '70% Jute, 30% Cotton' },
    shippingInfo: { isFreeShipping: true, estimatedDays: 5 },
  },

  // Sports & Fitness (FitLife)
  {
    vendorIndex: 3,
    name: 'Quick-Dial Adjustable Dumbbell 2.5kg to 24kg Pair',
    description: 'Replace 15 pairs of dumbbells in one compact system. Smooth dial selector allows incremental weight increases from 2.5kg to 24kg per dumbbell with laser-etched knurled steel grip.',
    price: 14999,
    comparePrice: 22999,
    category: 'Sports & Fitness',
    subcategory: 'Strength Equipment',
    tags: ['dumbbells', 'fitness', 'homegym', 'weights', 'strength'],
    images: [
      { url: 'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?w=800&fit=crop&q=80', isPrimary: true },
    ],
    stock: 35,
    sku: 'FL-DB-ADJ-24KG',
    weight: 50000,
    isFeatured: true,
    attributes: { weightRange: '2.5kg - 24kg each', count: 'Pair (2 units)', warranty: '2 Years' },
    shippingInfo: { isFreeShipping: true, estimatedDays: 5 },
  },
  {
    vendorIndex: 3,
    name: 'Eco-Dense Natural Tree Rubber Yoga Mat 5mm Pro',
    description: 'Zero-slip wet or dry grip. Non-toxic biodegradable natural tree rubber core with moisture-wicking polyurethane top surface. Body alignment alignment laser markings.',
    price: 2499,
    comparePrice: 3999,
    category: 'Sports & Fitness',
    subcategory: 'Yoga & Pilates',
    tags: ['yoga', 'yogamat', 'fitness', 'rubber', 'grip'],
    images: [
      { url: 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=800&fit=crop&q=80', isPrimary: true },
    ],
    stock: 90,
    sku: 'FL-MAT-RUBBER-5MM',
    weight: 2600,
    isFeatured: true,
    attributes: { thickness: '5mm', material: 'Natural Tree Rubber + PU', size: '183cm x 68cm' },
    shippingInfo: { isFreeShipping: true, estimatedDays: 3 },
  },
  {
    vendorIndex: 3,
    name: 'GPS Smart Multisport Fitness Watch 50m Waterproof',
    description: 'Built-in multi-constellation GPS, wrist-based heart rate, pulse oximeter, VO2 max estimation, 40+ sport profiles, offline music storage, and 12-day battery stamina.',
    price: 5499,
    comparePrice: 8999,
    category: 'Sports & Fitness',
    subcategory: 'Wearables',
    tags: ['smartwatch', 'gps', 'running', 'fitness-tracker', 'waterproof'],
    images: [
      { url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&fit=crop&q=80', isPrimary: true },
    ],
    stock: 50,
    sku: 'FL-WATCH-GPS-50M',
    isFeatured: false,
    attributes: { waterResistance: '50 Meters (5 ATM)', battery: '12 Days', display: 'AMOLED 1.4"' },
    shippingInfo: { isFreeShipping: true, estimatedDays: 2 },
  },
  {
    vendorIndex: 3,
    name: 'Pro Grade Deep-Tissue Percussion Massage Gun',
    description: 'Brushless high-torque motor delivering 14mm amplitude up to 3200 percussions per minute. Ultra-quiet QuietForce engineering, 6 swappable heads, 6-hour lithium battery.',
    price: 3999,
    comparePrice: 6999,
    category: 'Sports & Fitness',
    subcategory: 'Recovery Gear',
    tags: ['massage-gun', 'recovery', 'muscle-relief', 'fitness'],
    images: [
      { url: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&fit=crop&q=80', isPrimary: true },
    ],
    stock: 75,
    sku: 'FL-MGUN-BRUSHLESS',
    isFeatured: false,
    attributes: { speeds: '5 Levels', amplitude: '14mm', noiseLevel: '<45dB' },
    shippingInfo: { isFreeShipping: true, estimatedDays: 3 },
  },

  // Food & Gourmet (GourmetKart)
  {
    vendorIndex: 4,
    name: 'Single-Estate Darjeeling First Flush Rare Tea Hamper',
    description: 'Spring harvest hand-plucked from Makaibari estate at 5,000 ft altitude. Muscatel fragrance with delicate champagne notes. Packed in handcrafted cedar keepsake box with infuser.',
    price: 1899,
    comparePrice: 2999,
    category: 'Food & Gourmet',
    subcategory: 'Tea & Coffee',
    tags: ['tea', 'darjeeling', 'organic', 'gourmet', 'gift-box'],
    images: [
      { url: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=800&fit=crop&q=80', isPrimary: true },
    ],
    stock: 120,
    sku: 'GK-TEA-DARJ-FF',
    isFeatured: true,
    attributes: { harvest: 'First Flush', estate: 'Makaibari', weight: '250g Tin' },
    shippingInfo: { isFreeShipping: true, estimatedDays: 3 },
  },
  {
    vendorIndex: 4,
    name: 'Cold-Pressed Extra Virgin Spanish Olive Oil (1 Litre)',
    description: 'Harvested from single-origin Arbequina olives in Jaén, Andalusia within 4 hours of picking. Unfiltered, cold-extracted under 22°C. Low acidity <0.2%.',
    price: 1299,
    comparePrice: 1899,
    category: 'Food & Gourmet',
    subcategory: 'Oils & Vinegars',
    tags: ['olive-oil', 'extra-virgin', 'cold-pressed', 'spanish', 'organic'],
    images: [
      { url: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=800&fit=crop&q=80', isPrimary: true },
    ],
    stock: 200,
    sku: 'GK-EVOO-ESP-1L',
    isFeatured: false,
    attributes: { variety: '100% Arbequina', acidity: '<0.2%', volume: '1 Litre Dark Glass' },
    shippingInfo: { isFreeShipping: true, estimatedDays: 3 },
  },
  {
    vendorIndex: 4,
    name: 'Artisanal Single-Origin Dark Chocolate 85% Confection Box',
    description: 'Bean-to-bar microbatch chocolate crafted from Madagascan Criollo cacao beans. Roasted low and slow with organic unrefined cane sugar. Notes of red berries and toasted espresso.',
    price: 1499,
    comparePrice: 2200,
    category: 'Food & Gourmet',
    subcategory: 'Chocolates',
    tags: ['chocolate', 'dark-chocolate', 'bean-to-bar', 'artisan', 'vegan'],
    images: [
      { url: 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=800&fit=crop&q=80', isPrimary: true },
    ],
    stock: 80,
    sku: 'GK-CHOC-MADAG-85',
    isFeatured: false,
    attributes: { cocoaPercentage: '85%', origin: 'Sambirano Valley, Madagascar', netWeight: '240g' },
    shippingInfo: { isFreeShipping: true, estimatedDays: 2 },
  },
  {
    vendorIndex: 4,
    name: 'Pure Himalayan Kashmiri Mogra Saffron (2 Grams)',
    description: 'Highest Grade 1 Super Negin / Mogra saffron threads cultivated in the highlands of Pampore, Kashmir. Laboratory verified Crocin index exceeding 260. Distinctive sweet floral aroma.',
    price: 999,
    comparePrice: 1599,
    category: 'Food & Gourmet',
    subcategory: 'Spices',
    tags: ['saffron', 'kashmiri', 'spices', 'organic', 'grade-1'],
    images: [
      { url: 'https://images.unsplash.com/photo-1509358271058-acd22cc93898?w=800&fit=crop&q=80', isPrimary: true },
    ],
    stock: 95,
    sku: 'GK-SAFFRON-KASH-2G',
    isFeatured: true,
    attributes: { grade: 'Grade 1 Mogra', origin: 'Pampore, Kashmir', weight: '2 Grams' },
    shippingInfo: { isFreeShipping: true, estimatedDays: 2 },
  },

  // Beauty & Personal Care (BeautyBloom)
  {
    vendorIndex: 5,
    name: '20% Pure Vitamin C + Ferulic Acid Advanced Radiant Serum',
    description: 'Clinical grade antioxidant cocktail combining stabilized L-Ascorbic Acid 20%, Ferulic Acid 0.5%, and Vitamin E. Diminishes hyperpigmentation, protects against pollution, restores luminous glow.',
    price: 1299,
    comparePrice: 1999,
    category: 'Beauty & Personal Care',
    subcategory: 'Skincare',
    tags: ['serum', 'vitamin-c', 'skincare', 'brightening', 'anti-aging'],
    images: [
      { url: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800&fit=crop&q=80', isPrimary: true },
    ],
    stock: 300,
    sku: 'BB-SERUM-VITC-30ML',
    isFeatured: true,
    attributes: { volume: '30ml / 1 fl oz', skinType: 'All Skin Types', formula: 'Cruelty-Free, Fragrance-Free' },
    shippingInfo: { isFreeShipping: true, estimatedDays: 3 },
  },
  {
    vendorIndex: 5,
    name: 'Moroccan Cold-Pressed Pure Argan Oil Hair Therapy Elixir',
    description: 'Liquid gold for distressed tresses. 100% pure organic virgin Argan oil cold-pressed in Morocco. Tames unruly frizz, restores hydration, provides heat defense up to 230°C.',
    price: 1499,
    comparePrice: 2499,
    category: 'Beauty & Personal Care',
    subcategory: 'Hair Care',
    tags: ['argan-oil', 'hair-serum', 'moroccan', 'organic', 'haircare'],
    images: [
      { url: 'https://images.unsplash.com/photo-1608248597359-22a84a7376a9?w=800&fit=crop&q=80', isPrimary: true },
    ],
    stock: 180,
    sku: 'BB-ARGAN-ELIXIR-100',
    isFeatured: true,
    attributes: { volume: '100ml', origin: 'Essaouira, Morocco', certification: 'ECOCERT Organic' },
    shippingInfo: { isFreeShipping: true, estimatedDays: 3 },
  },
  {
    vendorIndex: 5,
    name: 'Sultans Amber & Royal Agarwood (Oud) Eau De Parfum 100ml',
    description: 'Opulent unisex oriental perfume opening with Bulgarian damask rose and saffron, unfolding into smoky Cambodian agarwood, Madagascar vanilla, and golden resinous amber.',
    price: 2999,
    comparePrice: 4999,
    category: 'Beauty & Personal Care',
    subcategory: 'Fragrances',
    tags: ['perfume', 'oud', 'amber', 'fragrance', 'luxury-scent'],
    images: [
      { url: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=800&fit=crop&q=80', isPrimary: true },
    ],
    stock: 85,
    sku: 'BB-EDP-OUD-100ML',
    isFeatured: true,
    attributes: { concentration: 'Eau De Parfum (25% Oil)', longevity: '14+ Hours', volume: '100ml' },
    shippingInfo: { isFreeShipping: true, estimatedDays: 2 },
  },
  {
    vendorIndex: 5,
    name: 'Multi-Molecular Hyaluronic Acid Ultra Hydrating Dew Gel',
    description: 'Infused with 5 molecular weights of Hyaluronic Acid, Centella Asiatica, and Ceramides. Delivers 72-hour moisture saturation deep into the dermal matrix without greasy residue.',
    price: 899,
    comparePrice: 1399,
    category: 'Beauty & Personal Care',
    subcategory: 'Skincare',
    tags: ['hyaluronic-acid', 'moisturizer', 'hydrating', 'dewy', 'gel'],
    images: [
      { url: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800&fit=crop&q=80', isPrimary: true },
    ],
    stock: 220,
    sku: 'BB-GEL-HYAL-50G',
    isFeatured: false,
    attributes: { weight: '50g', keyIngredients: '5D Hyaluronic Acid + Ceramides NP', finish: 'Dewy' },
    shippingInfo: { isFreeShipping: true, estimatedDays: 3 },
  },
];

// ─── Coupons Data ─────────────────────────────────────────────────────────────
const couponsData = [
  { code: 'WELCOME20', type: 'percentage', value: 20, minOrderAmount: 500, maxDiscount: 500, description: 'Welcome offer - 20% off your first purchase' },
  { code: 'FLAT200', type: 'fixed', value: 200, minOrderAmount: 1000, description: 'Flat ₹200 off on cart value above ₹1,000' },
  { code: 'TECH10', type: 'percentage', value: 10, minOrderAmount: 5000, maxDiscount: 2500, applicableCategories: ['Electronics'], description: '10% off top electronics' },
  { code: 'FASHION25', type: 'percentage', value: 25, minOrderAmount: 1500, maxDiscount: 1000, applicableCategories: ['Fashion'], description: '25% seasonal fashion discount' },
  { code: 'SUMMERFEST', type: 'percentage', value: 15, minOrderAmount: 2000, maxDiscount: 1500, description: '15% summer storewide discount' },
];

// ─── Review Templates ─────────────────────────────────────────────────────────
const reviewTemplates = [
  { rating: 5, title: 'Incredible quality and lightning delivery!', body: 'Far exceeded my expectations. Build quality is flawless and arrived within 24 hours.' },
  { rating: 5, title: 'Best purchase I have made this year', body: 'Genuine product verified directly with the manufacturer. Absolutely 10/10 recommend!' },
  { rating: 4, title: 'Solid product with great value', body: 'Performance has been rock solid over 2 weeks of heavy usage. Packaging was secure.' },
  { rating: 5, title: 'Unbeatable experience from this vendor', body: 'Premium packaging and unboxing experience. Customer support was also very helpful.' },
  { rating: 4, title: 'Worth every rupee', body: 'Very happy with the overall finish and performance. Will definitely order again.' },
];

async function seed() {
  console.log('🌱 Starting MarketNest Seed Script...');

  try {
    const conn = await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
    console.log(`✅ Connected to MongoDB at: ${conn.connection.host}:${conn.connection.port}`);
  } catch (err) {
    console.error(`❌ Could not connect to MongoDB: ${err.message}`);
    console.log('💡 Note: Start MongoDB (or run `docker compose up -d`) and re-run `npm run seed` to populate the database.');
    process.exit(0);
  }

  try {
    console.log('🧹 Purging existing collections...');
    await Promise.all([
      User.deleteMany({}),
      VendorProfile.deleteMany({}),
      Product.deleteMany({}),
      Cart.deleteMany({}),
      Order.deleteMany({}),
      SubOrder.deleteMany({}),
      PaymentSplit.deleteMany({}),
      Review.deleteMany({}),
      Coupon.deleteMany({}),
    ]);
    console.log('✅ Collections purged.');

    // 1. Create Admin
    const adminUser = await User.create({
      name: 'System Admin',
      email: 'admin@marketplace.com',
      password: 'Admin@123456',
      role: 'admin',
      isEmailVerified: true,
      phone: '+91 98765 00000',
    });
    console.log('👑 Admin user created: admin@marketplace.com');

    // 2. Create Vendors
    const vendorUsers = [];
    const vendorProfiles = [];

    for (const v of vendorsData) {
      const u = await User.create({
        name: v.name,
        email: v.email,
        password: 'Vendor@123456',
        role: 'vendor',
        isEmailVerified: true,
        phone: '+91 98765 43210',
      });

      const vp = await VendorProfile.create({
        userId: u._id,
        storeName: v.storeName,
        storeDescription: v.storeDescription,
        category: v.category,
        logo: v.logo,
        banner: v.banner,
        commissionRate: v.commissionRate,
        rating: v.rating,
        totalSales: v.totalSales,
        gstNumber: v.gstNumber,
        isApproved: true,
        approvedAt: new Date(),
        payoutSchedule: 'weekly',
        bankDetails: {
          accountHolderName: v.name,
          accountNumber: '918237465019',
          ifscCode: 'HDFC0001234',
          bankName: 'HDFC Bank Ltd',
        },
      });

      vendorUsers.push(u);
      vendorProfiles.push(vp);
    }
    console.log(`🏪 ${vendorUsers.length} Vendors created.`);

    // 3. Create Customers
    const customerNames = [
      'Aarav Sharma', 'Priya Patel', 'Rohan Mehta', 'Ananya Singh', 'Vikram Nair',
      'Deepika Reddy', 'Arjun Kumar', 'Pooja Gupta', 'Rahul Verma', 'Sneha Joshi',
      'Karan Malhotra', 'Ishita Banerjee', 'Siddharth Rao', 'Divya Menon', 'Aditya Shah',
      'Riya Kapoor', 'Nikhil Desai', 'Kavya Nambiar', 'Amit Pandey', 'Meera Iyer'
    ];

    const customerUsers = [];
    for (const cName of customerNames) {
      const email = `${cName.toLowerCase().replace(' ', '.')}@gmail.com`;
      const cust = await User.create({
        name: cName,
        email,
        password: 'Customer@123456',
        role: 'customer',
        isEmailVerified: true,
        phone: '+91 99887 76655',
        addresses: [{
          label: 'Home',
          street: '402, Skyline Towers, Linking Road',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400050',
          country: 'India',
          isDefault: true,
        }],
      });
      customerUsers.push(cust);
    }
    console.log(`🛒 ${customerUsers.length} Customers created.`);

    // 4. Create Products
    const createdProducts = [];
    for (const p of productsData) {
      const vendorUser = vendorUsers[p.vendorIndex];
      const vendorProf = vendorProfiles[p.vendorIndex];

      const product = await Product.create({
        vendorId: vendorUser._id,
        vendorProfileId: vendorProf._id,
        name: p.name,
        description: p.description,
        price: p.price,
        comparePrice: p.comparePrice,
        costPrice: Math.round(p.price * 0.65),
        category: p.category,
        subcategory: p.subcategory,
        tags: p.tags,
        images: p.images,
        stock: p.stock,
        sku: p.sku,
        weight: p.weight,
        isFeatured: p.isFeatured || false,
        shippingInfo: p.shippingInfo,
        attributes: p.attributes ? new Map(Object.entries(p.attributes)) : undefined,
      });

      createdProducts.push(product);
    }
    console.log(`📦 ${createdProducts.length} Products created across all categories.`);

    // 5. Create Reviews
    let reviewCount = 0;
    for (const prod of createdProducts) {
      const numReviews = Math.floor(Math.random() * 4) + 2;
      for (let r = 0; r < numReviews; r++) {
        const randCust = customerUsers[Math.floor(Math.random() * customerUsers.length)];
        const template = reviewTemplates[Math.floor(Math.random() * reviewTemplates.length)];

        try {
          await Review.create({
            productId: prod._id,
            customerId: randCust._id,
            vendorId: prod.vendorId,
            rating: template.rating,
            title: template.title,
            body: template.body,
            isVerifiedPurchase: true,
            helpfulVotes: Math.floor(Math.random() * 15),
          });
          reviewCount++;
        } catch {
          // Skip unique index collisions
        }
      }
    }
    console.log(`⭐ ${reviewCount} Reviews created.`);

    // 6. Create Coupons
    for (const c of couponsData) {
      await Coupon.create({
        ...c,
        createdBy: adminUser._id,
      });
    }
    console.log(`🎟️ ${couponsData.length} Coupons created.`);

    // 7. Create Sample Orders & Payment Splits
    for (let i = 0; i < 6; i++) {
      const cust = customerUsers[i];
      const p1 = createdProducts[i * 2];
      const p2 = createdProducts[i * 2 + 1];

      const items = [
        { productId: p1._id, vendorId: p1.vendorId, name: p1.name, image: p1.images[0]?.url, price: p1.price, quantity: 1, subtotal: p1.price },
        { productId: p2._id, vendorId: p2.vendorId, name: p2.name, image: p2.images[0]?.url, price: p2.price, quantity: 1, subtotal: p2.price },
      ];
      const totalAmount = p1.price + p2.price;

      const order = await Order.create({
        customerId: cust._id,
        items,
        shippingAddress: cust.addresses[0],
        totalAmount,
        subtotal: totalAmount,
        paymentStatus: 'paid',
        paymentMethod: i % 2 === 0 ? 'razorpay' : 'stripe',
      });

      // Group suborders by vendor
      for (const item of items) {
        const vendorProf = vendorProfiles.find(vp => vp.userId.toString() === item.vendorId.toString());
        const commRate = vendorProf?.commissionRate || 10;
        const commAmount = parseFloat(((item.subtotal * commRate) / 100).toFixed(2));
        const netPayout = parseFloat((item.subtotal - commAmount).toFixed(2));

        const subOrder = await SubOrder.create({
          orderId: order._id,
          vendorId: item.vendorId,
          customerId: cust._id,
          items: [item],
          subtotal: item.subtotal,
          commissionRate: commRate,
          commissionAmount: commAmount,
          vendorPayout: netPayout,
          status: ['placed', 'packed', 'shipped', 'delivered'][i % 4],
          trackingNumber: `TRK-IN-${Date.now()}-${i}`,
        });

        await PaymentSplit.create({
          orderId: order._id,
          subOrderId: subOrder._id,
          vendorId: item.vendorId,
          grossAmount: item.subtotal,
          commissionRate: commRate,
          commissionAmount: commAmount,
          netPayout,
          paymentGateway: order.paymentMethod,
          payoutStatus: subOrder.status === 'delivered' ? 'paid' : 'pending',
        });
      }
    }
    console.log('💳 Sample Orders and Payment Splits populated.');

    console.log('\n=======================================================');
    console.log('🎉 SEED SCRIPT COMPLETED SUCCESSFULLY!');
    console.log('Credentials:');
    console.log('👑 Admin:    admin@marketplace.com / Admin@123456');
    console.log('🏪 Vendor:   technova@marketplace.com / Vendor@123456');
    console.log('🛒 Customer: aarav.sharma@gmail.com / Customer@123456');
    console.log('=======================================================\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error during seeding:', err);
    process.exit(1);
  }
}

seed();
