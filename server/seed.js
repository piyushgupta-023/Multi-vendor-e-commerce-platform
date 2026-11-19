require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const User = require('./models/User');
const VendorProfile = require('./models/VendorProfile');
const Category = require('./models/Category');
const Product = require('./models/Product');
const Order = require('./models/Order');
const SubOrder = require('./models/SubOrder');
const PaymentSplit = require('./models/PaymentSplit');
const Review = require('./models/Review');
const Coupon = require('./models/Coupon');

// ─── 3 Default Vendors (TechNova Electronics, UrbanThread Fashion, CasaCraft Home & Kitchen) ───
const vendorsData = [
  {
    name: 'TechNova Electronics',
    email: 'technova@marketnest.com',
    password: 'admin123',
    storeName: 'TechNova Electronics',
    storeDescription: 'Authorized flagship electronics, high-fidelity wireless audio, noise-cancelling headphones, and smart home speakers.',
    category: 'Electronics',
    logo: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=300&h=300&fit=crop&q=80',
    banner: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&h=400&fit=crop&q=80',
    commissionRate: 8,
    rating: 4.8,
    totalSales: 1850,
  },
  {
    name: 'UrbanThread Fashion',
    email: 'urbanthread@marketnest.com',
    password: 'admin123',
    storeName: 'UrbanThread Fashion',
    storeDescription: 'Curated contemporary apparel, bespoke leather jackets, tailored outerwear, and minimalist titanium watches.',
    category: 'Fashion',
    logo: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=300&h=300&fit=crop&q=80',
    banner: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=1200&h=400&fit=crop&q=80',
    commissionRate: 12,
    rating: 4.7,
    totalSales: 3400,
  },
  {
    name: 'CasaCraft Home & Kitchen',
    email: 'casacraft@marketnest.com',
    password: 'admin123',
    storeName: 'CasaCraft Home & Kitchen',
    storeDescription: 'Artisan handcrafted solid wood furniture, bespoke home décor, and high-performance lifestyle kitchen appliances.',
    category: 'Home & Living',
    logo: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=300&h=300&fit=crop&q=80',
    banner: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1200&h=400&fit=crop&q=80',
    commissionRate: 10,
    rating: 4.9,
    totalSales: 2150,
  },
];

// ─── 16 Real Products across 4 Categories ────────────────────────────────────
// Categories: Electronics, Fashion, Home & Kitchen, Appliances
const productsData = [
  // ──── 1. ELECTRONICS (Vendor: TechNova) ───────────────────────────────────
  {
    vendorName: 'TechNova Electronics',
    name: 'Sony WH-1000XM5 Wireless Noise Cancelling Headphones',
    description: 'Industry-leading noise canceling with two processors and 8 microphones. Magnificent sound quality engineered with the new Integrated Processor V1. Up to 30-hour battery life with quick charging (3 min charge for 3 hours of playback). Ultra-comfortable, lightweight design with soft fit leather.',
    price: 26990,
    comparePrice: 34990,
    category: 'Electronics',
    subcategory: 'Audio',
    tags: ['headphones', 'sony', 'wireless', 'noise cancelling', 'bluetooth', 'audio'],
    stock: 45,
    ratings: { average: 4.8, count: 842 },
    isFeatured: true,
    attributes: {
      Brand: 'Sony',
      Model: 'WH-1000XM5',
      Color: 'Silver White',
      Connectivity: 'Bluetooth 5.2 / 3.5mm Aux',
      BatteryLife: '30 Hours',
      Warranty: '1 Year Manufacturer',
    },
    images: [
      { url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80', isPrimary: true },
      { url: 'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800&auto=format&fit=crop&q=80', isPrimary: false },
      { url: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800&auto=format&fit=crop&q=80', isPrimary: false },
    ],
    shippingInfo: { isFreeShipping: true, shippingCost: 0, estimatedDays: 1 },
  },
  {
    vendorName: 'TechNova Electronics',
    name: 'Apple AirPods Pro (2nd Generation) with MagSafe Case (USB-C)',
    description: 'Up to 2x more Active Noise Cancellation than previous generation. Transparency mode lets outside sound in, so you can hear what is going on around you. Personalized Spatial Audio with dynamic head tracking places sound all around you.',
    price: 20999,
    comparePrice: 24900,
    category: 'Electronics',
    subcategory: 'Audio',
    tags: ['apple', 'airpods', 'earbuds', 'wireless', 'usb-c', 'anc'],
    stock: 60,
    ratings: { average: 4.7, count: 1250 },
    isFeatured: true,
    attributes: {
      Brand: 'Apple',
      Model: 'AirPods Pro 2',
      Color: 'Glossy White',
      Connectivity: 'Bluetooth 5.3',
      BatteryLife: '30 Hours with Case',
      Warranty: '1 Year Apple Official',
    },
    images: [
      { url: 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=800&auto=format&fit=crop&q=80', isPrimary: true },
      { url: 'https://images.unsplash.com/photo-1588423771073-b8903fbb85b5?w=800&auto=format&fit=crop&q=80', isPrimary: false },
      { url: 'https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?w=800&auto=format&fit=crop&q=80', isPrimary: false },
    ],
    shippingInfo: { isFreeShipping: true, shippingCost: 0, estimatedDays: 1 },
  },
  {
    vendorName: 'TechNova Electronics',
    name: 'Marshall Stanmore III Bluetooth Home Speaker',
    description: 'Re-engineered for an expansive home stereo soundstage. Stanmore III delivers heavy-hitting signature Marshall audio with Bluetooth 5.2 and RCA/3.5mm analog inputs. Iconic vintage brass detailing and tactile control knobs.',
    price: 31999,
    comparePrice: 39999,
    category: 'Electronics',
    subcategory: 'Speakers',
    tags: ['marshall', 'speaker', 'bluetooth', 'audio', 'vintage', 'bass'],
    stock: 22,
    ratings: { average: 4.9, count: 420 },
    isFeatured: true,
    attributes: {
      Brand: 'Marshall',
      Model: 'Stanmore III',
      Color: 'Vintage Black & Brass',
      PowerOutput: '80 Watts RMS',
      Connectivity: 'Bluetooth 5.2 / RCA / 3.5mm',
      Warranty: '2 Years Manufacturer',
    },
    images: [
      { url: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=800&auto=format&fit=crop&q=80', isPrimary: true },
      { url: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=800&auto=format&fit=crop&q=80', isPrimary: false },
      { url: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=800&auto=format&fit=crop&q=80', isPrimary: false },
    ],
    shippingInfo: { isFreeShipping: true, shippingCost: 0, estimatedDays: 2 },
  },
  {
    vendorName: 'TechNova Electronics',
    name: 'UltraSlim 4K UHD Smart Gaming Monitor 27-Inch 144Hz',
    description: 'Breathtaking clarity with 3840x2160 UHD resolution, 144Hz refresh rate, 1ms response time, and HDR400 certified panel. Features 99% sRGB color gamut coverage and dual HDMI 2.1 ports for console and PC gaming.',
    price: 28499,
    comparePrice: 42999,
    category: 'Electronics',
    subcategory: 'Monitors',
    tags: ['monitor', '4k', 'gaming', '144hz', 'display', 'hdr'],
    stock: 18,
    ratings: { average: 4.6, count: 312 },
    isFeatured: false,
    attributes: {
      Brand: 'TechNova Pro',
      ScreenSize: '27 Inches',
      Resolution: '4K UHD (3840 x 2160)',
      RefreshRate: '144Hz',
      PanelType: 'IPS Anti-Glare',
      Warranty: '3 Years Comprehensive',
    },
    images: [
      { url: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800&auto=format&fit=crop&q=80', isPrimary: true },
      { url: 'https://images.unsplash.com/photo-1585792180666-f75a7c518801?w=800&auto=format&fit=crop&q=80', isPrimary: false },
      { url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&auto=format&fit=crop&q=80', isPrimary: false },
    ],
    shippingInfo: { isFreeShipping: true, shippingCost: 0, estimatedDays: 2 },
  },

  // ──── 2. FASHION (Vendor: StyleHub) ───────────────────────────────────────
  {
    vendorName: 'UrbanThread Fashion',
    name: "Men's Classic Leather Biker Bomber Jacket - Vintage Espresso",
    description: 'Masterfully crafted from 100% full-grain genuine lambskin leather. Features heavy-duty YKK gunmetal zippers, quilted viscose lining, zippered cuffs, and dual internal security pockets. Timeless silhouette that patinas with age.',
    price: 3499,
    comparePrice: 6999,
    category: 'Fashion',
    subcategory: 'Men Outerwear',
    tags: ['jacket', 'leather', 'menswear', 'biker', 'vintage', 'fashion'],
    stock: 35,
    ratings: { average: 4.6, count: 185 },
    isFeatured: true,
    attributes: {
      Brand: 'StyleHub Atelier',
      Material: '100% Full-Grain Lambskin Leather',
      Fit: 'Slim Regular',
      Closure: 'Asymmetric YKK Heavy Zipper',
      Color: 'Vintage Espresso Brown',
      Care: 'Specialist Leather Clean',
    },
    images: [
      { url: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&auto=format&fit=crop&q=80', isPrimary: true },
      { url: 'https://images.unsplash.com/photo-1495105787522-5334e3ffa0ef?w=800&auto=format&fit=crop&q=80', isPrimary: false },
      { url: 'https://images.unsplash.com/photo-1520975954732-35dd22299614?w=800&auto=format&fit=crop&q=80', isPrimary: false },
    ],
    shippingInfo: { isFreeShipping: true, shippingCost: 0, estimatedDays: 1 },
  },
  {
    vendorName: 'UrbanThread Fashion',
    name: "Women's Oversized Cashmere Wool Blend Trench Coat",
    description: 'An enduring wardrobe investment combining 70% virgin wool and 30% Mongolian cashmere. Designed with an elegant double-breasted button front, matching tie belt, deep slant pockets, and a fluid tailored silhouette.',
    price: 4299,
    comparePrice: 8499,
    category: 'Fashion',
    subcategory: 'Women Outerwear',
    tags: ['coat', 'cashmere', 'wool', 'trench', 'womenswear', 'luxury'],
    stock: 28,
    ratings: { average: 4.8, count: 210 },
    isFeatured: true,
    attributes: {
      Brand: 'StyleHub Atelier',
      Material: '70% Virgin Wool / 30% Cashmere',
      Length: 'Below-Knee Midi',
      Color: 'Camel Tan',
      Lining: '100% Silk Twill',
      Care: 'Dry Clean Only',
    },
    images: [
      { url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=800&auto=format&fit=crop&q=80', isPrimary: true },
      { url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&auto=format&fit=crop&q=80', isPrimary: false },
      { url: 'https://images.unsplash.com/photo-1485968579580-b6d095142e6e?w=800&auto=format&fit=crop&q=80', isPrimary: false },
    ],
    shippingInfo: { isFreeShipping: true, shippingCost: 0, estimatedDays: 2 },
  },
  {
    vendorName: 'UrbanThread Fashion',
    name: 'Handcrafted Italian Full-Grain Leather Chelsea Boots',
    description: 'Artisanal Italian leather boots constructed with Goodyear welt durability. Elasticated side gussets and dual nylon pull tabs ensure effortless wear. Fitted with shock-absorbing memory foam insoles and non-slip Vibram rubber outsoles.',
    price: 3899,
    comparePrice: 7299,
    category: 'Fashion',
    subcategory: 'Footwear',
    tags: ['boots', 'chelsea', 'leather', 'footwear', 'shoes', 'italian'],
    stock: 50,
    ratings: { average: 4.7, count: 164 },
    isFeatured: false,
    attributes: {
      Brand: 'Vannucci Milano',
      UpperMaterial: 'Waxed Full-Grain Calf Leather',
      Sole: 'Vibram Lugged Rubber Sole',
      Construction: 'Goodyear Welted',
      Color: 'Antique Cognac Brown',
    },
    images: [
      { url: 'https://images.unsplash.com/photo-1638247025967-b4e38f787b76?w=800&auto=format&fit=crop&q=80', isPrimary: true },
      { url: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&auto=format&fit=crop&q=80', isPrimary: false },
      { url: 'https://images.unsplash.com/photo-1560343090-f0409e92791a?w=800&auto=format&fit=crop&q=80', isPrimary: false },
    ],
    shippingInfo: { isFreeShipping: true, shippingCost: 0, estimatedDays: 1 },
  },
  {
    vendorName: 'UrbanThread Fashion',
    name: 'Minimalist Titanium Chronograph Waterproof Wristwatch',
    description: 'Precision Japanese Miyota quartz movement encased in ultra-light aerospace-grade titanium. Features scratch-resistant sapphire crystal glass, 50-meter water resistance, luminous hands, and a quick-release Milanese mesh strap.',
    price: 2499,
    comparePrice: 4999,
    category: 'Fashion',
    subcategory: 'Watches',
    tags: ['watch', 'chronograph', 'titanium', 'accessories', 'luxury'],
    stock: 40,
    ratings: { average: 4.5, count: 340 },
    isFeatured: false,
    attributes: {
      Brand: 'Chronos Atelier',
      CaseDiameter: '40 mm',
      CaseMaterial: 'Aerospace Grade 5 Titanium',
      Glass: 'Anti-Reflective Sapphire Crystal',
      WaterResistance: '5 ATM / 50 Meters',
    },
    images: [
      { url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80', isPrimary: true },
      { url: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=800&auto=format&fit=crop&q=80', isPrimary: false },
      { url: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800&auto=format&fit=crop&q=80', isPrimary: false },
    ],
    shippingInfo: { isFreeShipping: true, shippingCost: 0, estimatedDays: 1 },
  },

  // ──── 3. HOME & KITCHEN (Vendor: HomeElegance) ───────────────────────────
  {
    vendorName: 'CasaCraft Home & Kitchen',
    name: 'Handcrafted Teakwood Ergonomic Lounge Accent Chair',
    description: 'Sustainably sourced kiln-dried plantation teak frame paired with hand-woven natural rattan caning. Ergonomically angled backrest and high-density linen foam seat cushion provide optimal lumbar support.',
    price: 8999,
    comparePrice: 15999,
    category: 'Home & Living',
    subcategory: 'Furniture',
    tags: ['chair', 'furniture', 'teakwood', 'handcrafted', 'accent chair', 'living room'],
    stock: 15,
    ratings: { average: 4.9, count: 98 },
    isFeatured: true,
    attributes: {
      Brand: 'HomeElegance Living',
      WoodType: '100% Solid Grade-A Plantation Teak',
      Finish: 'Non-Toxic Natural Beeswax Matte Finish',
      WeightCapacity: '150 kg',
      Dimensions: '72 x 68 x 78 cm',
      Assembly: 'Pre-Assembled',
    },
    images: [
      { url: 'https://images.unsplash.com/photo-1580481077195-c22e4b4f99bf?w=800&auto=format&fit=crop&q=80', isPrimary: true },
      { url: 'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=800&auto=format&fit=crop&q=80', isPrimary: false },
      { url: 'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=800&auto=format&fit=crop&q=80', isPrimary: false },
    ],
    shippingInfo: { isFreeShipping: true, shippingCost: 0, estimatedDays: 3 },
  },
  {
    vendorName: 'CasaCraft Home & Kitchen',
    name: 'Nordic Minimalist Dimmable LED Arc Floor Lamp',
    description: 'Sculptural architectural lighting with an elegant brushed brass arch and heavy solid Carrara marble base. Features touch-sensitive stepless dimming from 10% to 100% and 3 adjustable color temperatures.',
    price: 2999,
    comparePrice: 5499,
    category: 'Home & Living',
    subcategory: 'Lighting',
    tags: ['lamp', 'lighting', 'floor lamp', 'nordic', 'marble', 'led'],
    stock: 32,
    ratings: { average: 4.6, count: 142 },
    isFeatured: false,
    attributes: {
      Brand: 'Lumiere Studios',
      BaseMaterial: 'Authentic White Carrara Marble',
      Shade: 'Spun Matte Aluminum',
      MaxWattage: '18W Energy-Saving LED',
      TotalHeight: '190 cm',
    },
    images: [
      { url: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800&auto=format&fit=crop&q=80', isPrimary: true },
      { url: 'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=800&auto=format&fit=crop&q=80', isPrimary: false },
      { url: 'https://images.unsplash.com/photo-1540932239986-30128078f3c5?w=800&auto=format&fit=crop&q=80', isPrimary: false },
    ],
    shippingInfo: { isFreeShipping: true, shippingCost: 0, estimatedDays: 2 },
  },
  {
    vendorName: 'CasaCraft Home & Kitchen',
    name: 'Natural Woven Jute & Wool Textured Area Rug (5x7 ft)',
    description: 'Hand-loomed by master artisans using 60% golden Indian jute and 40% un-dyed New Zealand wool. Features an intricate chevron weave that brings organic warmth, sound dampening, and earthy texture to any living space.',
    price: 3499,
    comparePrice: 6299,
    category: 'Home & Living',
    subcategory: 'Home Decor',
    tags: ['rug', 'carpet', 'jute', 'wool', 'handwoven', 'decor'],
    stock: 24,
    ratings: { average: 4.7, count: 89 },
    isFeatured: false,
    attributes: {
      Brand: 'HomeElegance Rugs',
      Weave: 'Hand-Loomed Flatweave',
      Material: '60% Golden Jute / 40% Pure Wool',
      Size: '150 x 210 cm (5 x 7 ft)',
      Backing: 'Natural Non-Slip Latex Backing',
    },
    images: [
      { url: 'https://images.unsplash.com/photo-1600121848594-d8644e57abab?w=800&auto=format&fit=crop&q=80', isPrimary: true },
      { url: 'https://images.unsplash.com/photo-1582533561751-ef6f6ab93a2e?w=800&auto=format&fit=crop&q=80', isPrimary: false },
      { url: 'https://images.unsplash.com/photo-1616046229478-9901c5536a45?w=800&auto=format&fit=crop&q=80', isPrimary: false },
    ],
    shippingInfo: { isFreeShipping: true, shippingCost: 0, estimatedDays: 2 },
  },
  {
    vendorName: 'CasaCraft Home & Kitchen',
    name: 'Solid Walnut Desk Organizer with Magnetic Wireless Charger',
    description: 'Hand-carved from a single block of North American Black Walnut wood. Integrated with an official Qi 15W fast-charging magnetic wireless pad for iPhone and Android devices, dedicated pen slots, and brass stand.',
    price: 1799,
    comparePrice: 3299,
    category: 'Home & Living',
    subcategory: 'Office & Desk',
    tags: ['desk organizer', 'walnut', 'wood', 'charger', 'gadget', 'office'],
    stock: 65,
    ratings: { average: 4.8, count: 276 },
    isFeatured: true,
    attributes: {
      Brand: 'HomeElegance Studio',
      Wood: 'Solid Black Walnut (FSC Certified)',
      WirelessCharger: '15W Fast Charge Qi-Certified',
      Port: 'USB Type-C (Braided cable included)',
      Dimensions: '28 x 14 x 2.2 cm',
    },
    images: [
      { url: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&auto=format&fit=crop&q=80', isPrimary: true },
      { url: 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=800&auto=format&fit=crop&q=80', isPrimary: false },
      { url: 'https://images.unsplash.com/photo-1585776245991-cf89dd7fc73a?w=800&auto=format&fit=crop&q=80', isPrimary: false },
    ],
    shippingInfo: { isFreeShipping: true, shippingCost: 0, estimatedDays: 1 },
  },

  // ──── 4. APPLIANCES (Vendor: HomeElegance) ───────────────────────────────
  {
    vendorName: 'CasaCraft Home & Kitchen',
    name: 'Smart Multi-Function Digital Air Fryer with Touch Display (5.5L)',
    description: 'Crisp and cook with up to 85% less oil using Rapid 360-degree Air Circulation technology. Features 10 one-touch preset cooking menus, tempered glass digital touch screen, dishwasher-safe non-stick basket, and automatic shutoff.',
    price: 4499,
    comparePrice: 7999,
    category: 'Kitchen & Appliances',
    subcategory: 'Small Appliances',
    tags: ['air fryer', 'kitchen', 'appliances', 'cooking', 'healthy'],
    stock: 55,
    ratings: { average: 4.7, count: 512 },
    isFeatured: true,
    attributes: {
      Brand: 'AeroChef Pro',
      Capacity: '5.5 Litres (Serves 4-6)',
      Power: '1700 Watts High Speed',
      TemperatureRange: '80°C - 200°C',
      Coating: 'PFOA-Free Ceramic Nonstick',
      Warranty: '2 Years Doorstep Replacement',
    },
    images: [
      { url: 'https://images.unsplash.com/photo-1585515320310-259814833e62?w=800&auto=format&fit=crop&q=80', isPrimary: true },
      { url: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=800&auto=format&fit=crop&q=80', isPrimary: false },
      { url: 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=800&auto=format&fit=crop&q=80', isPrimary: false },
    ],
    shippingInfo: { isFreeShipping: true, shippingCost: 0, estimatedDays: 1 },
  },
  {
    vendorName: 'CasaCraft Home & Kitchen',
    name: 'Professional Espresso Coffee Machine with 15-Bar Milk Frother',
    description: 'Craft barista-quality espresso, silky lattes, and cappuccinos in your home. Powered by a high-pressure 15-bar Italian pump, Thermo-Block rapid heating system, commercial 58mm stainless portafilter, and high-pressure steam wand.',
    price: 9999,
    comparePrice: 16999,
    category: 'Kitchen & Appliances',
    subcategory: 'Coffee & Tea',
    tags: ['coffee machine', 'espresso', 'kitchen', 'appliances', 'barista', 'frother'],
    stock: 20,
    ratings: { average: 4.8, count: 384 },
    isFeatured: true,
    attributes: {
      Brand: 'CaffeMaster Classico',
      Pressure: '15 Bar Italian High Pressure',
      WaterTank: '1.8L Removable Transparent Tank',
      Boiler: 'Instant Thermo-Block Stainless Steel',
      Accessories: 'Single & Double Shot Portafilters, Tamper, Milk Pitcher',
      Warranty: '2 Years Manufacturer',
    },
    images: [
      { url: 'https://images.unsplash.com/photo-1517668808822-9ebb02ae2a0e?w=800&auto=format&fit=crop&q=80', isPrimary: true },
      { url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&auto=format&fit=crop&q=80', isPrimary: false },
      { url: 'https://images.unsplash.com/photo-1534432182912-63863115e106?w=800&auto=format&fit=crop&q=80', isPrimary: false },
    ],
    shippingInfo: { isFreeShipping: true, shippingCost: 0, estimatedDays: 1 },
  },
  {
    vendorName: 'CasaCraft Home & Kitchen',
    name: 'Heavy-Duty Enameled Cast Iron Dutch Oven Pot (5.2 Qt)',
    description: 'Superior heat distribution and retention for braising, baking artisan sourdough bread, slow-stewing, and roasting. Vibrant chip-resistant enamel coating requires no seasoning. Heavy snug-fitting lid with condensation bumps.',
    price: 3299,
    comparePrice: 5999,
    category: 'Kitchen & Appliances',
    subcategory: 'Cookware',
    tags: ['dutch oven', 'cast iron', 'cookware', 'kitchen', 'pot', 'baking'],
    stock: 38,
    ratings: { average: 4.9, count: 190 },
    isFeatured: false,
    attributes: {
      Brand: 'Heritage Cookware',
      Capacity: '5.2 Litres (5.5 Quarts)',
      Material: 'Enameled Heavy Cast Iron',
      Color: 'Fiery Cherry Red',
      OvenSafe: 'Safe up to 260°C (500°F)',
      Compatibility: 'Induction, Gas, Electric, Glass, Ceramic',
    },
    images: [
      { url: 'https://images.unsplash.com/photo-1584990347449-3995874de30e?w=800&auto=format&fit=crop&q=80', isPrimary: true },
      { url: 'https://images.unsplash.com/photo-1583778176476-4a8b02a64c01?w=800&auto=format&fit=crop&q=80', isPrimary: false },
      { url: 'https://images.unsplash.com/photo-1590794056226-79ef3a8147e1?w=800&auto=format&fit=crop&q=80', isPrimary: false },
    ],
    shippingInfo: { isFreeShipping: true, shippingCost: 0, estimatedDays: 2 },
  },
  {
    vendorName: 'CasaCraft Home & Kitchen',
    name: '1200W High-Speed Precision Blender for Smoothies & Ice Crushing',
    description: 'Crush whole fruits, tough seeds, leafy greens, and rock-hard ice in seconds. Features an ultra-powerful 1200-watt pure copper motor, 6 aircraft-grade laser-cut titanium blades, and two BPA-free Tritan travel cups with sip lids.',
    price: 2999,
    comparePrice: 4999,
    category: 'Kitchen & Appliances',
    subcategory: 'Small Appliances',
    tags: ['blender', 'smoothie', 'kitchen', 'appliances', 'ice crusher'],
    stock: 44,
    ratings: { average: 4.6, count: 228 },
    isFeatured: false,
    attributes: {
      Brand: 'Vortex NutriBlend',
      Power: '1200 Watts Peak Power',
      Speed: '24,000 RPM',
      Jars: '1.8L Family Pitcher + 700ml Travel Cup with Sip Lid',
      BladeMaterial: 'Laser-Cut Hardened Titanium Steel',
      Warranty: '2 Years Motor Warranty',
    },
    images: [
      { url: 'https://images.unsplash.com/photo-1570222094114-d054a817e56b?w=800&auto=format&fit=crop&q=80', isPrimary: true },
      { url: 'https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?w=800&auto=format&fit=crop&q=80', isPrimary: false },
      { url: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&auto=format&fit=crop&q=80', isPrimary: false },
    ],
    shippingInfo: { isFreeShipping: true, shippingCost: 0, estimatedDays: 1 },
  },
];

/**
 * Clean Database Seeder:
 * - Admin: admin@marketnest.com / admin123
 * - Customer: buyer@marketnest.com / buyer123
 * - Vendors: TechNova, StyleHub, HomeElegance
 * - 16 Products across Electronics, Fashion, Home & Kitchen, Appliances
 */
async function seedDatabase() {
  try {
    const existingData = await Promise.all(
      Object.values(require('./models')).map((model) => model.exists({}))
    );
    if (existingData.some(Boolean)) {
      console.log('Database already contains application data; sample seeding was skipped.');
      return false;
    }

    // 2. Ensure Admin always exists (admin@marketnest.com / admin123)
    let admin = await User.findOne({ email: 'admin@marketnest.com' });
    if (!admin) {
      admin = await User.create({
        name: 'MarketNest Admin',
        email: 'admin@marketnest.com',
        password: 'admin123',
        role: 'admin',
        isEmailVerified: true,
        phone: '+91 98765 00000',
        authProvider: 'local',
      });
      console.log('👑 Admin created: admin@marketnest.com / admin123');
    } else if (admin.role !== 'admin') {
      admin.role = 'admin';
      await admin.save({ validateBeforeSave: false });
      console.log('👑 Admin role confirmed for admin@marketnest.com');
    }

    // 3. Ensure Test Customer exists (buyer@marketnest.com / buyer123)
    let buyer = await User.findOne({ email: 'buyer@marketnest.com' });
    if (!buyer) {
      buyer = await User.create({
        name: 'Rahul Sharma',
        email: 'buyer@marketnest.com',
        password: 'buyer123',
        role: 'customer',
        isEmailVerified: true,
        phone: '+91 98765 12345',
        authProvider: 'local',
        addresses: [
          {
            label: 'Home',
            fullName: 'Rahul Sharma',
            street: '402, Lotus Grandeur, Connaught Place',
            city: 'New Delhi',
            state: 'Delhi',
            pincode: '110001',
            country: 'India',
            isDefault: true,
          },
        ],
      });
      console.log('🛒 Buyer created: buyer@marketnest.com / buyer123');
    }

    // 4. Ensure 3 Default Vendors Exist (TechNova Electronics, UrbanThread Fashion, CasaCraft Home & Kitchen)
    const vendorMap = {};
    for (let vendorIndex = 0; vendorIndex < vendorsData.length; vendorIndex++) {
      const v = vendorsData[vendorIndex];
      let vendorUser = await User.findOne({ email: v.email });
      if (!vendorUser) {
        vendorUser = await User.create({
          name: v.name,
          email: v.email,
          password: v.password,
          role: 'vendor',
          isEmailVerified: true,
          phone: `+91 98765 9999${vendorIndex}`,
          authProvider: 'local',
        });
      } else {
        vendorUser.name = v.name;
        vendorUser.role = 'vendor';
        await vendorUser.save({ validateBeforeSave: false });
      }

      let vendorProfile = await VendorProfile.findOne({ userId: vendorUser._id });
      if (!vendorProfile) {
        vendorProfile = await VendorProfile.create({
          userId: vendorUser._id,
          storeName: v.storeName,
          storeSlug: v.storeName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
          storeDescription: v.storeDescription,
          category: v.category,
          logo: v.logo,
          banner: v.banner,
          commissionRate: v.commissionRate,
          rating: v.rating,
          totalSales: v.totalSales,
          isApproved: true,
        });
      } else {
        vendorProfile.storeName = v.storeName;
        vendorProfile.storeDescription = v.storeDescription;
        vendorProfile.logo = v.logo;
        vendorProfile.banner = v.banner;
        vendorProfile.rating = v.rating;
        vendorProfile.isApproved = true;
        await vendorProfile.save({ validateBeforeSave: false });
      }

      vendorMap[v.name] = { user: vendorUser, profile: vendorProfile };
      console.log(`🏪 Vendor verified: ${v.storeName}`);
    }

    // 5. Check if catalog needs seeding
    console.log('🌱 Force-seeding MarketNest multi-vendor database catalog...');

    // 5. Create 16 Products across 4 Categories
    const createdProducts = [];
    for (let i = 0; i < productsData.length; i++) {
      const p = productsData[i];
      const vendorInfo = vendorMap[p.vendorName] || Object.values(vendorMap)[0];
      const category = await Category.findOrCreateByName(p.category);

      const sku = `MN-${p.category.replace(/[^a-zA-Z]/g, '').substring(0, 3).toUpperCase()}-${String(i + 1).padStart(4, '0')}`;
      
      const product = await Product.create({
        name: p.name,
        description: p.description,
        price: p.price,
        comparePrice: p.comparePrice,
        category: p.category,
        categoryId: category._id,
        subcategory: p.subcategory,
        tags: p.tags,
        stock: p.stock,
        ratings: p.ratings,
        isFeatured: p.isFeatured,
        attributes: p.attributes,
        images: p.images,
        shippingInfo: p.shippingInfo,
        sku,
        vendorId: vendorInfo.user._id,
        vendorProfileId: vendorInfo.profile._id,
        isActive: true,
      });

      createdProducts.push(product);
    }
    console.log(`📦 Successfully seeded ${createdProducts.length} real products across 4 categories.`);

    return true;
  } catch (err) {
    console.error('❌ Error in seedDatabase:', err.message);
    throw err;
  }
}

async function runStandalone() {
  console.log('🌱 Starting Standalone MarketNest Seeder...');
  try {
    await connectDB();
    await seedDatabase();
    await mongoose.disconnect();
    console.log('✅ Seeding finished successfully.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Standalone seeding failed:', err.message);
    process.exit(1);
  }
}

if (require.main === module) {
  runStandalone();
}

module.exports = { seedDatabase };
