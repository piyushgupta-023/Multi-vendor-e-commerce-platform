# ARCHITECTURE & API DOCUMENTATION
### Multi-Vendor E-Commerce Marketplace — Single Source of Truth

> [!IMPORTANT]
> This document is the authoritative reference for all system architecture, data models, REST APIs, and environment configuration. All contributors must keep this document up to date when introducing changes.

---

## Table of Contents

1. [Role Definitions & Permissions Matrix](#1-role-definitions--permissions-matrix)
2. [System Architecture Diagram](#2-system-architecture-diagram)
3. [Database ER Diagram](#3-database-er-diagram)
4. [Database Schema Design](#4-database-schema-design)
5. [REST API Documentation](#5-rest-api-documentation)
   - [Module 1: Auth](#module-1-auth)
   - [Module 2: Vendor Onboarding & S3 Upload](#module-2-vendor-onboarding--s3-upload)
   - [Module 3: Elasticsearch Product Search](#module-3-elasticsearch-product-search)
   - [Module 4: Redis Cart & Order Lifecycle](#module-4-redis-cart--order-lifecycle)
   - [Module 5: Split Payments (Razorpay & Stripe)](#module-5-split-payments-razorpay--stripe)
   - [Module 6: Reviews, Coupons & PDF Invoices](#module-6-reviews-coupons--pdf-invoices)
   - [Module 7: Admin Analytics](#module-7-admin-analytics)
6. [Environment Variables Reference](#6-environment-variables-reference)
7. [Database Initialization and Migrations](#database-initialization-and-migrations)

---

## 1. Role Definitions & Permissions Matrix

The platform supports three distinct roles. Permissions are enforced by JWT middleware on every protected route.

| Role | Description | Token Claim |
|------|-------------|-------------|
| **Customer** | End-user who browses, purchases, and reviews products | `role: "customer"` |
| **Vendor** | Seller who lists products, manages inventory, and receives payouts | `role: "vendor"` |
| **Admin** | Platform operator with full system access and moderation powers | `role: "admin"` |

---

### 1.1 Auth & Profile

| Permission | Customer | Vendor | Admin |
|------------|:--------:|:------:|:-----:|
| Register account | ✅ | ✅ | ❌ (seeded) |
| Login | ✅ | ✅ | ✅ |
| View own profile (`GET /api/auth/me`) | ✅ | ✅ | ✅ |
| Edit own profile (`PUT /api/auth/profile`) | ✅ | ✅ | ✅ |
| Logout / invalidate token | ✅ | ✅ | ✅ |
| Refresh JWT token | ✅ | ✅ | ✅ |
| View any user's profile | ❌ | ❌ | ✅ |
| Change any user's role | ❌ | ❌ | ✅ |
| Suspend / ban any user | ❌ | ❌ | ✅ |

---

### 1.2 Product Operations

| Permission | Customer | Vendor | Admin |
|------------|:--------:|:------:|:-----:|
| Browse & search products | ✅ | ✅ | ✅ |
| View single product detail | ✅ | ✅ | ✅ |
| View featured products | ✅ | ✅ | ✅ |
| Create a new product listing | ❌ | ✅ (own store) | ✅ |
| Edit a product listing | ❌ | ✅ (own only) | ✅ |
| Delete a product listing | ❌ | ✅ (own only) | ✅ |
| Upload product images to S3 | ❌ | ✅ | ✅ |
| Activate / deactivate a product | ❌ | ✅ (own only) | ✅ |
| Delete **any** product (moderation) | ❌ | ❌ | ✅ |

---

### 1.3 Cart & Orders

| Permission | Customer | Vendor | Admin |
|------------|:--------:|:------:|:-----:|
| View own cart | ✅ | ❌ | ❌ |
| Add / update / remove cart items | ✅ | ❌ | ❌ |
| Clear cart | ✅ | ❌ | ❌ |
| Place an order | ✅ | ❌ | ❌ |
| View own orders | ✅ | ❌ | ❌ |
| View sub-orders for own products | ❌ | ✅ | ✅ |
| Update sub-order status | ❌ | ✅ (own only) | ✅ |
| View **all** orders (platform-wide) | ❌ | ❌ | ✅ |
| Cancel any order | ❌ | ❌ | ✅ |

---

### 1.4 Reviews

| Permission | Customer | Vendor | Admin |
|------------|:--------:|:------:|:-----:|
| Submit a product review | ✅ (purchased only) | ❌ | ❌ |
| View reviews for a product | ✅ | ✅ | ✅ |
| Mark a review as helpful | ✅ | ✅ | ✅ |
| Delete own review | ✅ | ❌ | ✅ |
| Delete **any** review (moderation) | ❌ | ❌ | ✅ |

---

### 1.5 Payments & Payouts

| Permission | Customer | Vendor | Admin |
|------------|:--------:|:------:|:-----:|
| Initiate Razorpay order | ✅ | ❌ | ❌ |
| Verify Razorpay payment | ✅ | ❌ | ❌ |
| Initiate Stripe PaymentIntent | ✅ | ❌ | ❌ |
| Confirm Stripe payment | ✅ | ❌ | ❌ |
| View payment splits for own orders | ✅ | ✅ (own) | ✅ |
| Trigger vendor payouts | ❌ | ❌ | ✅ |
| View payout history | ❌ | ✅ (own) | ✅ |

---

### 1.6 Coupons

| Permission | Customer | Vendor | Admin |
|------------|:--------:|:------:|:-----:|
| Validate / apply a coupon at checkout | ✅ | ❌ | ❌ |
| Create store-specific coupon | ❌ | ✅ | ✅ |
| Create platform-wide (global) coupon | ❌ | ❌ | ✅ |
| Deactivate own coupon | ❌ | ✅ | ✅ |
| Deactivate **any** coupon | ❌ | ❌ | ✅ |

---

### 1.7 Analytics & Reports

| Permission | Customer | Vendor | Admin |
|------------|:--------:|:------:|:-----:|
| View own order history analytics | ✅ | ❌ | ❌ |
| View own store analytics (revenue, orders) | ❌ | ✅ | ✅ |
| View platform-wide dashboard | ❌ | ❌ | ✅ |
| View all vendor performance reports | ❌ | ❌ | ✅ |
| View top-selling products report | ❌ | ❌ | ✅ |
| View revenue analytics | ❌ | ❌ | ✅ |
| Download PDF invoices | ✅ (own) | ✅ (own) | ✅ |

---

### 1.8 User & Vendor Management (Admin Only)

| Permission | Customer | Vendor | Admin |
|------------|:--------:|:------:|:-----:|
| List all registered users | ❌ | ❌ | ✅ |
| Suspend / activate a user account | ❌ | ❌ | ✅ |
| List all vendor applications | ❌ | ❌ | ✅ |
| Approve / reject a vendor application | ❌ | ❌ | ✅ |
| Set vendor commission rate | ❌ | ❌ | ✅ |
| View vendor payout schedules | ❌ | ❌ | ✅ |

---

### 1.9 Platform Configuration (Admin Only)

| Permission | Customer | Vendor | Admin |
|------------|:--------:|:------:|:-----:|
| Configure global commission rate | ❌ | ❌ | ✅ |
| Manage category taxonomy | ❌ | ❌ | ✅ |
| Trigger Elasticsearch re-index | ❌ | ❌ | ✅ |
| Manage system-wide settings | ❌ | ❌ | ✅ |

---

## 2. System Architecture Diagram

```mermaid
flowchart TD
    subgraph CLIENT["🖥️ Client Layer"]
        FE["React (Vite) Frontend\nReact Router · Redux Toolkit\nTailwind CSS"]
        AXIOS["Axios HTTP Layer\nRequest Interceptors · Auth Header\nResponse Error Handling"]
    end

    subgraph GATEWAY["🔀 API Gateway — Express.js"]
        MW_JWT["JWT Auth Middleware\nverifyToken · roleGuard"]
        MW_RATE["Rate Limiter\n(Redis — ioredis)"]
        MW_CORS["CORS · Helmet · Morgan"]
        ROUTER["Express Router\n/api/*"]
    end

    subgraph CONTROLLERS["🎮 Controllers"]
        C_AUTH["AuthController\nregister · login · refresh\nprofile · logout"]
        C_PROD["ProductController\ncreate · update · delete\ngetOne · featured"]
        C_CART["CartController\nadd · update · remove · clear"]
        C_ORDER["OrderController\ncreate · getOne · myOrders\nsubOrder status"]
        C_PAY["PaymentController\nRazorpay · Stripe\nsplits · payouts"]
        C_REV["ReviewController\ncreate · helpful · delete"]
        C_ADMIN["AdminController\ndashboard · users · vendors\nanalytics · moderation"]
    end

    subgraph SERVICES["⚙️ Service Layer"]
        S_AUTH["AuthService\nbcrypt · JWT sign/verify"]
        S_VENDOR["VendorService\nonboard · profile · analytics"]
        S_SEARCH["SearchService\nElasticsearch queries\nfull-text · filters · facets"]
        S_CART["CartService\nRedis-backed cart ops\ncoupon application"]
        S_ORDER["OrderService\ntransactional order creation\nsub-order splitting"]
        S_PAY["PaymentService\nRazorpay SDK · Stripe SDK\nwebhook handlers"]
        S_INV["InvoiceService\nPDFKit generation\npdf buffering · S3 upload"]
        S_COUPON["CouponService\nvalidation · expiry · usage tracking"]
        S_S3["S3Service\npresigned URL generation\nMulter + AWS SDK v3"]
    end

    subgraph DATABASES["🗄️ Data Stores"]
        MONGO[("MongoDB\nvia Mongoose\nPrimary Data Store")]
        REDIS[("Redis\nvia ioredis\nCart · Session\nRate Limit")]
        ES[("Elasticsearch\nProduct Full-Text Search\nFilters · Facets · Autocomplete")]
        S3[("AWS S3\nProduct Images\nInvoice PDFs")]
    end

    subgraph PAYMENTS["💳 Payment Gateways"]
        RAZORPAY["Razorpay\nOrder API · Verify Signature\nRoute-Based Transfer (split)"]
        STRIPE["Stripe Connect\nPaymentIntent · Confirm\nTransfer to Connected Accounts"]
    end

    subgraph EXTERNAL["🌐 External APIs"]
        DUMMY["DummyJSON API\nSeed product &\nuser data"]
    end

    FE -->|HTTP/HTTPS| AXIOS
    AXIOS -->|Bearer JWT| MW_CORS
    MW_CORS --> MW_RATE
    MW_RATE --> MW_JWT
    MW_JWT --> ROUTER
    ROUTER --> C_AUTH & C_PROD & C_CART & C_ORDER & C_PAY & C_REV & C_ADMIN

    C_AUTH --> S_AUTH
    C_PROD --> S_SEARCH & S_S3
    C_CART --> S_CART & S_COUPON
    C_ORDER --> S_ORDER & S_INV
    C_PAY --> S_PAY
    C_REV --> S_AUTH
    C_ADMIN --> S_VENDOR

    S_AUTH --> MONGO
    S_VENDOR --> MONGO
    S_SEARCH --> ES
    S_SEARCH --> MONGO
    S_CART --> REDIS
    S_CART --> MONGO
    S_ORDER --> MONGO
    S_INV --> S3
    S_PAY --> RAZORPAY & STRIPE
    S_PAY --> MONGO
    S_S3 --> S3
    MW_RATE --> REDIS

    EXTERNAL -->|Seed Script| MONGO
    EXTERNAL -->|Seed Script| ES
```

---

## 3. Database ER Diagram

```mermaid
erDiagram
    USER {
        ObjectId id PK
        string name
        string email
        string passwordHash
        string role
        string avatar
        string phone
        array address
        boolean isVerified
        datetime createdAt
    }

    VENDOR_PROFILE {
        ObjectId id PK
        ObjectId userId FK
        string storeName
        string storeDescription
        string logo
        string banner
        float commissionRate
        object bankDetails
        string payoutSchedule
        float totalEarnings
        boolean isApproved
        datetime createdAt
    }

    PRODUCT {
        ObjectId id PK
        ObjectId vendorId FK
        string name
        string description
        float price
        float comparePrice
        string category
        string subcategory
        array tags
        array images
        int stock
        string sku
        float weight
        object dimensions
        object ratings
        string elasticsearchId
        boolean isActive
        datetime createdAt
    }

    CART {
        ObjectId id PK
        ObjectId userId FK
        array items
        string couponApplied
        float totalAmount
        datetime updatedAt
    }

    ORDER {
        ObjectId id PK
        ObjectId customerId FK
        array items
        float totalAmount
        object shippingAddress
        string paymentStatus
        string paymentMethod
        string razorpayOrderId
        string stripePaymentIntentId
        string couponApplied
        float discountAmount
        string invoiceUrl
        datetime createdAt
    }

    SUB_ORDER {
        ObjectId id PK
        ObjectId orderId FK
        ObjectId vendorId FK
        array items
        float subtotal
        float commission
        float vendorPayout
        string status
        string trackingNumber
        datetime estimatedDelivery
        datetime updatedAt
    }

    PAYMENT_SPLIT {
        ObjectId id PK
        ObjectId orderId FK
        ObjectId vendorId FK
        float grossAmount
        float commissionRate
        float commissionAmount
        float netPayout
        string payoutStatus
        string razorpayTransferId
        string stripeTransferId
        datetime processedAt
    }

    REVIEW {
        ObjectId id PK
        ObjectId productId FK
        ObjectId customerId FK
        ObjectId vendorId FK
        int rating
        string title
        string body
        array images
        boolean isVerified
        int helpfulVotes
        datetime createdAt
    }

    COUPON {
        ObjectId id PK
        string code
        string type
        float value
        float minOrderAmount
        float maxDiscount
        ObjectId vendorId FK
        int usageLimit
        int usedCount
        datetime expiresAt
        boolean isActive
    }

    USER ||--o| VENDOR_PROFILE : "has one"
    USER ||--o{ CART : "owns"
    USER ||--o{ ORDER : "places"
    USER ||--o{ REVIEW : "writes"
    VENDOR_PROFILE ||--o{ PRODUCT : "lists"
    VENDOR_PROFILE ||--o{ SUB_ORDER : "fulfills"
    VENDOR_PROFILE ||--o{ PAYMENT_SPLIT : "receives"
    VENDOR_PROFILE ||--o{ COUPON : "creates"
    PRODUCT ||--o{ REVIEW : "receives"
    ORDER ||--o{ SUB_ORDER : "splits into"
    ORDER ||--o{ PAYMENT_SPLIT : "generates"
    ORDER }o--o| COUPON : "applies"
    CART }o--o| COUPON : "applies"
```

---

## 4. Database Schema Design

### 4.1 User Schema

```js
// models/User.js
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const addressSchema = new mongoose.Schema({
  label:    { type: String, default: 'Home' },        // "Home", "Work", etc.
  line1:    { type: String, required: true },
  line2:    { type: String },
  city:     { type: String, required: true },
  state:    { type: String, required: true },
  pincode:  { type: String, required: true },
  country:  { type: String, default: 'India' },
  isDefault:{ type: Boolean, default: false },
}, { _id: true });

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: 2,
    maxlength: 60,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,                   // Index: unique
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Invalid email format'],
  },
  passwordHash: {
    type: String,
    required: true,
    select: false,                  // Never returned in queries by default
  },
  role: {
    type: String,
    enum: ['customer', 'vendor', 'admin'],
    default: 'customer',
  },
  avatar: {
    type: String,
    default: null,                  // S3 URL or null
  },
  phone: {
    type: String,
    match: [/^\+?[1-9]\d{9,14}$/, 'Invalid phone number'],
    default: null,
  },
  address: [addressSchema],         // Embedded array of addresses
  isVerified: {
    type: Boolean,
    default: false,
  },
  isActive: {
    type: Boolean,
    default: true,                  // Admin can deactivate accounts
  },
  refreshToken: {
    type: String,
    select: false,                  // Stored hashed, not exposed
  },
  lastLogin: { type: Date },
}, {
  timestamps: true,                 // createdAt, updatedAt auto-managed
});

// Index declarations
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ role: 1 });
userSchema.index({ createdAt: -1 });

// Pre-save hook: hash password before storing
userSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash')) return next();
  this.passwordHash = await bcrypt.hash(this.passwordHash, 12);
  next();
});

// Instance method: compare plain password with hash
userSchema.methods.comparePassword = async function (plain) {
  return bcrypt.compare(plain, this.passwordHash);
};

export default mongoose.model('User', userSchema);
```

---

### 4.2 VendorProfile Schema

```js
// models/VendorProfile.js
import mongoose from 'mongoose';

const bankDetailsSchema = new mongoose.Schema({
  accountNo:   { type: String, required: true },
  ifscCode:    { type: String, required: true, uppercase: true },
  bankName:    { type: String, required: true },
  accountName: { type: String, required: true },
}, { _id: false });

const vendorProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,                   // One-to-one with User
  },
  storeName: {
    type: String,
    required: [true, 'Store name is required'],
    trim: true,
    unique: true,
    minlength: 3,
    maxlength: 80,
  },
  storeDescription: {
    type: String,
    maxlength: 1000,
    default: '',
  },
  logo: {
    type: String,
    default: null,                  // S3 URL
  },
  banner: {
    type: String,
    default: null,                  // S3 URL
  },
  commissionRate: {
    type: Number,
    default: 10,                    // Platform's cut in percentage (e.g., 10%)
    min: 0,
    max: 100,
  },
  bankDetails: {
    type: bankDetailsSchema,
    default: null,
  },
  payoutSchedule: {
    type: String,
    enum: ['weekly', 'biweekly', 'monthly'],
    default: 'weekly',
  },
  totalEarnings: {
    type: Number,
    default: 0,
    min: 0,
  },
  isApproved: {
    type: Boolean,
    default: false,                 // Admin must approve vendors
  },
  approvedAt: { type: Date, default: null },
  approvedBy: {                     // Admin user ref
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
}, {
  timestamps: true,
});

vendorProfileSchema.index({ userId: 1 }, { unique: true });
vendorProfileSchema.index({ storeName: 'text' });
vendorProfileSchema.index({ isApproved: 1 });

export default mongoose.model('VendorProfile', vendorProfileSchema);
```

---

### 4.3 Product Schema

```js
// models/Product.js
import mongoose from 'mongoose';

const dimensionsSchema = new mongoose.Schema({
  length: { type: Number, min: 0 },
  width:  { type: Number, min: 0 },
  height: { type: Number, min: 0 },
  unit:   { type: String, default: 'cm' },
}, { _id: false });

const ratingsSchema = new mongoose.Schema({
  average: { type: Number, default: 0, min: 0, max: 5 },
  count:   { type: Number, default: 0, min: 0 },
}, { _id: false });

const productSchema = new mongoose.Schema({
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'VendorProfile',
    required: true,
  },
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    minlength: 3,
    maxlength: 200,
  },
  description: {
    type: String,
    required: true,
    maxlength: 5000,
  },
  price: {
    type: Number,
    required: true,
    min: [0, 'Price must be non-negative'],
  },
  comparePrice: {
    type: Number,
    default: null,                  // Strikethrough / MRP price
    min: 0,
  },
  category: {
    type: String,
    required: true,
    trim: true,
    index: true,
  },
  subcategory: {
    type: String,
    trim: true,
    default: null,
  },
  tags: [{ type: String, trim: true }],
  images: [{
    url: { type: String, required: true },  // S3 URL
    key: { type: String, required: true },  // S3 object key for deletion
    isPrimary: { type: Boolean, default: false },
  }],
  stock: {
    type: Number,
    required: true,
    min: 0,
    default: 0,
  },
  sku: {
    type: String,
    unique: true,
    uppercase: true,
    trim: true,
  },
  weight: {
    type: Number,
    min: 0,
    default: null,                  // in grams
  },
  dimensions: {
    type: dimensionsSchema,
    default: null,
  },
  ratings: {
    type: ratingsSchema,
    default: () => ({ average: 0, count: 0 }),
  },
  elasticsearchId: {
    type: String,
    default: null,                  // ES document _id for cross-referencing
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

// Compound indexes for frequent query patterns
productSchema.index({ vendorId: 1, isActive: 1 });
productSchema.index({ category: 1, isActive: 1 });
productSchema.index({ price: 1 });
productSchema.index({ 'ratings.average': -1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ name: 'text', description: 'text', tags: 'text' }); // MongoDB text index (fallback)

export default mongoose.model('Product', productSchema);
```

---

### 4.4 Cart Schema

```js
// models/Cart.js
// NOTE: Cart is primarily cached in Redis (key: cart:<userId>).
// MongoDB persists a fallback / reconciliation copy.
import mongoose from 'mongoose';

const cartItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'VendorProfile',
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    max: 99,
  },
  price: {
    type: Number,
    required: true,
    min: 0,                         // Price at time of add-to-cart (snapshot)
  },
  name: { type: String },           // Denormalized for display
  image: { type: String },          // Primary image URL (denormalized)
}, { _id: true });

const cartSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,                   // One cart per user
  },
  items: [cartItemSchema],
  couponApplied: {
    type: String,
    default: null,                  // Coupon code string
  },
  couponDiscount: {
    type: Number,
    default: 0,
  },
  totalAmount: {
    type: Number,
    default: 0,
    min: 0,
  },
}, {
  timestamps: true,
});

cartSchema.index({ userId: 1 }, { unique: true });

export default mongoose.model('Cart', cartSchema);
```

---

### 4.5 Order Schema

```js
// models/Order.js
import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  productId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  vendorId:    { type: mongoose.Schema.Types.ObjectId, ref: 'VendorProfile', required: true },
  name:        { type: String, required: true },      // Snapshot at time of order
  image:       { type: String },
  quantity:    { type: Number, required: true, min: 1 },
  priceAtOrder:{ type: Number, required: true },      // Immutable price snapshot
}, { _id: true });

const shippingAddressSchema = new mongoose.Schema({
  fullName:  { type: String, required: true },
  line1:     { type: String, required: true },
  line2:     { type: String },
  city:      { type: String, required: true },
  state:     { type: String, required: true },
  pincode:   { type: String, required: true },
  country:   { type: String, default: 'India' },
  phone:     { type: String, required: true },
}, { _id: false });

const orderSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  items: [orderItemSchema],
  totalAmount: {
    type: Number,
    required: true,
    min: 0,
  },
  shippingAddress: {
    type: shippingAddressSchema,
    required: true,
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded', 'partially_refunded'],
    default: 'pending',
  },
  paymentMethod: {
    type: String,
    enum: ['razorpay', 'stripe', 'cod'],
    required: true,
  },
  razorpayOrderId:        { type: String, default: null },
  razorpayPaymentId:      { type: String, default: null },
  stripePaymentIntentId:  { type: String, default: null },
  couponApplied:    { type: String, default: null },
  discountAmount:   { type: Number, default: 0 },
  shippingFee:      { type: Number, default: 0 },
  taxAmount:        { type: Number, default: 0 },
  invoiceUrl:       { type: String, default: null },  // S3 PDF URL
  notes:            { type: String, default: null },
}, {
  timestamps: true,
});

orderSchema.index({ customerId: 1, createdAt: -1 });
orderSchema.index({ paymentStatus: 1 });
orderSchema.index({ razorpayOrderId: 1 });
orderSchema.index({ stripePaymentIntentId: 1 });
orderSchema.index({ createdAt: -1 });

export default mongoose.model('Order', orderSchema);
```

---

### 4.6 SubOrder Schema

```js
// models/SubOrder.js
import mongoose from 'mongoose';

const subOrderItemSchema = new mongoose.Schema({
  productId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  name:         { type: String, required: true },
  quantity:     { type: Number, required: true, min: 1 },
  priceAtOrder: { type: Number, required: true },
}, { _id: true });

const subOrderSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true,
  },
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'VendorProfile',
    required: true,
  },
  items: [subOrderItemSchema],
  subtotal: {
    type: Number,
    required: true,
    min: 0,
  },
  commission: {
    type: Number,
    required: true,                 // Absolute commission amount charged
  },
  commissionRate: {
    type: Number,
    required: true,                 // % rate locked at time of order
  },
  vendorPayout: {
    type: Number,
    required: true,                 // subtotal - commission
  },
  status: {
    type: String,
    enum: ['placed', 'confirmed', 'packed', 'shipped', 'delivered', 'cancelled', 'returned'],
    default: 'placed',
  },
  trackingNumber:    { type: String, default: null },
  carrier:           { type: String, default: null },
  estimatedDelivery: { type: Date, default: null },
  deliveredAt:       { type: Date, default: null },
}, {
  timestamps: true,
});

subOrderSchema.index({ orderId: 1 });
subOrderSchema.index({ vendorId: 1, status: 1 });
subOrderSchema.index({ vendorId: 1, createdAt: -1 });

export default mongoose.model('SubOrder', subOrderSchema);
```

---

### 4.7 PaymentSplit Schema

```js
// models/PaymentSplit.js
import mongoose from 'mongoose';

const paymentSplitSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true,
  },
  subOrderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SubOrder',
    required: true,
  },
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'VendorProfile',
    required: true,
  },
  grossAmount: {
    type: Number,
    required: true,                 // Full product value for this vendor slice
  },
  commissionRate: {
    type: Number,
    required: true,
  },
  commissionAmount: {
    type: Number,
    required: true,                 // grossAmount * (commissionRate / 100)
  },
  netPayout: {
    type: Number,
    required: true,                 // grossAmount - commissionAmount
  },
  payoutStatus: {
    type: String,
    enum: ['pending', 'processing', 'paid', 'failed', 'on_hold'],
    default: 'pending',
    index: true,
  },
  razorpayTransferId: { type: String, default: null },
  stripeTransferId:   { type: String, default: null },
  processedAt:        { type: Date, default: null },
  failureReason:      { type: String, default: null },
}, {
  timestamps: true,
});

paymentSplitSchema.index({ orderId: 1 });
paymentSplitSchema.index({ vendorId: 1, payoutStatus: 1 });
paymentSplitSchema.index({ payoutStatus: 1, createdAt: -1 });

export default mongoose.model('PaymentSplit', paymentSplitSchema);
```

---

### 4.8 Review Schema

```js
// models/Review.js
import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'VendorProfile',
    required: true,
  },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true,                 // Enforce "verified purchase" constraint
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  title: {
    type: String,
    trim: true,
    maxlength: 150,
    default: '',
  },
  body: {
    type: String,
    required: true,
    maxlength: 2000,
  },
  images: [{
    url: { type: String },          // S3 URL for review images
    key: { type: String },
  }],
  isVerified: {
    type: Boolean,
    default: true,                  // true = purchased and confirmed
  },
  helpfulVotes: {
    type: Number,
    default: 0,
    min: 0,
  },
  helpfulVoters: [{                 // Track who voted helpful to prevent duplicates
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  isHidden: {
    type: Boolean,
    default: false,                 // Admin moderation flag
  },
}, {
  timestamps: true,
});

// One review per customer per product (compound unique)
reviewSchema.index({ productId: 1, customerId: 1 }, { unique: true });
reviewSchema.index({ productId: 1, rating: -1 });
reviewSchema.index({ vendorId: 1 });
reviewSchema.index({ createdAt: -1 });

export default mongoose.model('Review', reviewSchema);
```

---

### 4.9 Coupon Schema

```js
// models/Coupon.js
import mongoose from 'mongoose';

const couponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
    minlength: 4,
    maxlength: 20,
    match: [/^[A-Z0-9_-]+$/, 'Invalid coupon code format'],
  },
  type: {
    type: String,
    enum: ['percentage', 'fixed'],
    required: true,
  },
  value: {
    type: Number,
    required: true,
    min: 0,                         // Percentage (0–100) or fixed INR/USD amount
  },
  minOrderAmount: {
    type: Number,
    default: 0,                     // Minimum cart value to apply coupon
  },
  maxDiscount: {
    type: Number,
    default: null,                  // Cap on percentage discounts (null = uncapped)
  },
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'VendorProfile',
    default: null,                  // null = global platform coupon
  },
  applicableProducts: [{            // Empty = applies to all products
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
  }],
  applicableCategories: [{ type: String }],
  usageLimit: {
    type: Number,
    default: null,                  // null = unlimited
    min: 1,
  },
  usageLimitPerUser: {
    type: Number,
    default: 1,
  },
  usedCount: {
    type: Number,
    default: 0,
    min: 0,
  },
  usedBy: [{                        // Track user IDs who used this coupon
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  expiresAt: {
    type: Date,
    required: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

couponSchema.index({ code: 1 }, { unique: true });
couponSchema.index({ vendorId: 1, isActive: 1 });
couponSchema.index({ expiresAt: 1 });

export default mongoose.model('Coupon', couponSchema);
```

---

## 5. REST API Documentation

> [!NOTE]
> **Base URL:** `http://localhost:5000` (development) · `https://api.yourdomain.com` (production)
>
> **Authentication:** All protected routes require an `Authorization: Bearer <JWT>` header.
>
> **Standard Error Response:**
> ```json
> { "success": false, "message": "Human-readable error", "code": "ERROR_CODE" }
> ```
>
> **Standard Success Response:**
> ```json
> { "success": true, "data": { ... }, "message": "Optional message" }
> ```

---

### Module 1: Auth

| Method | Endpoint | Auth Role | Request Body / Params | Response | Description |
|--------|----------|-----------|----------------------|----------|-------------|
| `POST` | `/api/auth/register` | Public | `{ name, email, password, role: "customer"\|"vendor", phone? }` | `{ token, refreshToken, user }` | Registers a new Customer or Vendor. Vendor accounts require admin approval before full access. Password is hashed with bcrypt (12 rounds). |
| `POST` | `/api/auth/login` | Public | `{ email, password }` | `{ token, refreshToken, user }` | Authenticates user, returns short-lived JWT (15 min) and HTTP-only refresh token cookie (7 days). Updates `lastLogin`. |
| `GET` | `/api/auth/me` | Customer · Vendor · Admin | Header: `Authorization: Bearer <token>` | `{ user: { id, name, email, role, avatar, phone, address, isVerified } }` | Returns the currently authenticated user's profile. Password hash is excluded. |
| `PUT` | `/api/auth/profile` | Customer · Vendor · Admin | `{ name?, phone?, avatar?, address? }` (multipart if avatar upload) | `{ user }` | Updates the authenticated user's own profile fields. Email changes require re-verification (not yet implemented). |
| `POST` | `/api/auth/logout` | Customer · Vendor · Admin | — (uses refresh token cookie) | `{ message: "Logged out" }` | Clears refresh token from DB and expires the HTTP-only cookie. Adds JWT to Redis denylist until expiry. |
| `POST` | `/api/auth/refresh-token` | Public (refresh token cookie) | Cookie: `refreshToken` | `{ token }` | Issues a new short-lived JWT using the refresh token. Rotates refresh token on every use (prevents replay). |

---

### Module 2: Vendor Onboarding & S3 Upload

| Method | Endpoint | Auth Role | Request Body / Params | Response | Description |
|--------|----------|-----------|----------------------|----------|-------------|
| `POST` | `/api/vendor/onboard` | Vendor | `{ storeName, storeDescription, logo?, banner?, bankDetails: { accountNo, ifscCode, bankName, accountName }, payoutSchedule }` | `{ vendorProfile }` | Creates a VendorProfile linked to the authenticated user. Sets `isApproved: false`. Triggers admin notification. |
| `GET` | `/api/vendor/profile` | Vendor · Admin | — | `{ vendorProfile }` | Returns the authenticated vendor's full profile including bank details and earnings. |
| `PUT` | `/api/vendor/profile` | Vendor | `{ storeName?, storeDescription?, logo?, banner?, bankDetails?, payoutSchedule? }` | `{ vendorProfile }` | Updates vendor's own store profile. Bank detail changes trigger admin re-review flag. |
| `POST` | `/api/vendor/products` | Vendor | `multipart/form-data: { name, description, price, comparePrice?, category, subcategory?, tags[], stock, sku, weight?, dimensions?, images[] }` | `{ product }` | Creates a new product. Images are uploaded to S3. Product is indexed in Elasticsearch. Validates stock and price. |
| `PUT` | `/api/vendor/products/:id` | Vendor | `{ name?, description?, price?, stock?, isActive?, images? }` | `{ product }` | Updates an existing product. Only the owning vendor can update. Syncs changes to Elasticsearch index. |
| `DELETE` | `/api/vendor/products/:id` | Vendor | — | `{ message: "Product deleted" }` | Soft-deletes product (`isActive: false`) and removes from Elasticsearch. S3 images are NOT deleted (for order history). |
| `GET` | `/api/vendor/orders` | Vendor | Query: `?status=&page=&limit=&startDate=&endDate=` | `{ subOrders[], total, page, pages }` | Returns all sub-orders assigned to the vendor's store, paginated and filterable by status and date range. |
| `GET` | `/api/vendor/analytics` | Vendor | Query: `?period=7d\|30d\|90d\|1y` | `{ revenue, totalOrders, averageOrderValue, topProducts[], recentOrders[], fulfillmentRate }` | Returns store-specific analytics aggregated from SubOrder and PaymentSplit collections. |
| `POST` | `/api/vendor/upload-image` | Vendor | `{ fileName, fileType, folder: "products"\|"store" }` | `{ presignedUrl, key, publicUrl }` | Generates an AWS S3 presigned PUT URL valid for 5 minutes. Client uploads directly to S3. Returns the eventual public URL for saving in the product document. |

---

### Module 3: Elasticsearch Product Search

| Method | Endpoint | Auth Role | Request Body / Params | Response | Description |
|--------|----------|-----------|----------------------|----------|-------------|
| `GET` | `/api/products/search` | Public | Query: `?q=keyword&category=&subcategory=&minPrice=&maxPrice=&sort=relevance\|price_asc\|price_desc\|newest\|rating&page=1&limit=20&tags=&vendorId=&inStock=true` | `{ products[], total, page, pages, facets: { categories[], priceRange, ratings[] } }` | Full-text search via Elasticsearch with multi-field boosting (name^3, tags^2, description^1). Supports range filters, category aggregations (facets), and cursor-based pagination. Falls back to MongoDB text index if ES is unavailable. |
| `GET` | `/api/products/:id` | Public | Path: `productId` | `{ product, vendor: { storeName, logo }, relatedProducts[] }` | Returns single product with vendor info joined. Increments a view counter in Redis. Fetches 4 related products via ES `more_like_this` query. |
| `GET` | `/api/products/featured` | Public | Query: `?limit=12` | `{ products[] }` | Returns top-rated, in-stock products. Sourced from an ES query sorted by `ratings.average DESC` with `stock > 0` filter. |
| `GET` | `/api/products/by-vendor/:vendorId` | Public | Path: `vendorId`. Query: `?page=&limit=&sort=` | `{ products[], vendorProfile, total }` | Lists all active products for a given vendor. Used for the public vendor storefront page. |
| `GET` | `/api/products/categories` | Public | — | `{ categories: [{ name, subcategories[], productCount }] }` | Returns the full category taxonomy aggregated from Elasticsearch using terms aggregation. Cached in Redis for 10 minutes. |

---

### Delivery Location Lookup

| Method | Endpoint | Auth Role | Request Body / Params | Response | Description |
|--------|----------|-----------|----------------------|----------|-------------|
| `GET` | `/api/location/pincode/:pincode` | Public | Path: 6-digit Indian PIN code | `{ pincode, officeName, district, state }` | Looks up the delivery district and state using the Indian postal-code directory. |

---

### Module 4: Redis Cart & Order Lifecycle

| Method | Endpoint | Auth Role | Request Body / Params | Response | Description |
|--------|----------|-----------|----------------------|----------|-------------|
| `GET` | `/api/cart` | Customer | — | `{ cart: { items[], totalAmount, couponApplied, couponDiscount } }` | Reads cart from Redis (`cart:<userId>` key). Falls back to MongoDB if cache miss. Real-time price validation against current product prices. |
| `POST` | `/api/cart/add` | Customer | `{ productId, quantity }` | `{ cart }` | Adds item to Redis cart. Validates product exists, is active, and has sufficient stock. Merges if product already in cart. Updates `totalAmount`. |
| `PUT` | `/api/cart/update` | Customer | `{ productId, quantity }` | `{ cart }` | Updates quantity of an existing cart item. Validates stock ceiling. Quantity `0` removes the item. |
| `DELETE` | `/api/cart/remove/:productId` | Customer | Path: `productId` | `{ cart }` | Removes a single item from the cart. Recalculates totals. Updates Redis and MongoDB. |
| `DELETE` | `/api/cart/clear` | Customer | — | `{ message: "Cart cleared" }` | Removes all items from cart. Deletes Redis key and clears MongoDB cart document. |
| `POST` | `/api/orders/create` | Customer | `{ paymentMethod, shippingAddressId, couponCode? }` | `{ order, subOrders[], paymentSplits[] }` | Transactional order creation: (1) validates cart, (2) validates stock, (3) deducts stock, (4) creates Order + SubOrders split by vendor, (5) creates PaymentSplits, (6) clears cart, (7) applies coupon if valid. |
| `GET` | `/api/orders/:id` | Customer · Admin | Path: `orderId` | `{ order, subOrders[], paymentSplits[] }` | Returns full order detail. Customers can only access their own orders (ownership enforced). |
| `GET` | `/api/orders/my-orders` | Customer | Query: `?page=&limit=&status=` | `{ orders[], total, page, pages }` | Returns paginated order history for the authenticated customer, newest first. |
| `PUT` | `/api/orders/suborder/:id/status` | Vendor · Admin | `{ status: "confirmed"\|"packed"\|"shipped"\|"delivered"\|"cancelled", trackingNumber?, carrier?, estimatedDelivery? }` | `{ subOrder }` | Vendor updates their sub-order fulfillment status. Status transitions are enforced (e.g., cannot go backwards). Triggers customer notification on `shipped` and `delivered`. |

---

### Module 5: Split Payments (Razorpay & Stripe)

| Method | Endpoint | Auth Role | Request Body / Params | Response | Description |
|--------|----------|-----------|----------------------|----------|-------------|
| `POST` | `/api/payments/razorpay/create-order` | Customer | `{ orderId }` | `{ razorpayOrderId, amount, currency, keyId }` | Creates a Razorpay order server-side using the stored Order's `totalAmount`. Returns the order ID needed to initialize Razorpay Checkout on the frontend. |
| `POST` | `/api/payments/razorpay/verify` | Customer | `{ razorpayOrderId, razorpayPaymentId, razorpaySignature, orderId }` | `{ success: true, order }` | Verifies Razorpay HMAC signature server-side. On success: updates Order `paymentStatus` to `"paid"`, triggers PaymentSplit processing (Razorpay Route transfers to vendor accounts). |
| `POST` | `/api/payments/stripe/create-intent` | Customer | `{ orderId, currency?: "usd"\|"inr" }` | `{ clientSecret, paymentIntentId }` | Creates a Stripe PaymentIntent for the order amount. Returns `client_secret` for frontend Stripe.js `confirmCardPayment`. |
| `POST` | `/api/payments/stripe/confirm` | Customer | `{ paymentIntentId, orderId }` | `{ success: true, order }` | Called after frontend confirms payment. Retrieves PaymentIntent from Stripe API to validate `status === "succeeded"`. Updates Order and triggers Stripe Connect transfers for each vendor. |
| `GET` | `/api/payments/splits/:orderId` | Customer · Vendor · Admin | Path: `orderId` | `{ splits: [{ vendorId, grossAmount, commission, netPayout, payoutStatus }] }` | Returns payment split breakdown for an order. Customers see aggregated view; vendors see only their slice; admins see all. |
| `POST` | `/api/payments/trigger-payouts` | Admin | `{ vendorIds?: [], payoutSchedule?: "weekly"\|"all" }` | `{ processed: N, failed: M, details[] }` | Manually triggers payout processing for all `pending` PaymentSplits. Executes Razorpay transfers or Stripe Connect payouts based on vendor's payment gateway preference. Updates `payoutStatus` to `"processing"` then `"paid"`. |

---

### Module 6: Reviews, Coupons & PDF Invoices

| Method | Endpoint | Auth Role | Request Body / Params | Response | Description |
|--------|----------|-----------|----------------------|----------|-------------|
| `POST` | `/api/reviews` | Customer | `{ productId, orderId, rating, title?, body, images[]? }` | `{ review }` | Creates a verified purchase review. Validates the customer actually bought the product via `orderId`. Enforces one review per customer per product. Updates Product `ratings.average` and `ratings.count` atomically. Syncs rating to Elasticsearch. |
| `GET` | `/api/reviews/product/:productId` | Public | Path: `productId`. Query: `?page=&limit=&sort=newest\|highest\|lowest\|helpful&rating=` | `{ reviews[], total, ratingBreakdown: { 1:N, 2:N, 3:N, 4:N, 5:N } }` | Returns paginated reviews for a product with rating distribution breakdown. |
| `PUT` | `/api/reviews/:id/helpful` | Customer · Vendor · Admin | — | `{ helpfulVotes }` | Toggles the current user's "helpful" vote on a review. Prevents duplicate votes using the `helpfulVoters` array. |
| `DELETE` | `/api/reviews/:id` | Customer (own) · Admin | — | `{ message: "Review deleted" }` | Deletes a review. Customers can only delete their own. Admins can delete any. Recalculates product rating on deletion. |
| `POST` | `/api/coupons` | Vendor · Admin | `{ code, type, value, minOrderAmount?, maxDiscount?, vendorId?, usageLimit?, usageLimitPerUser?, expiresAt, applicableProducts[]?, applicableCategories[]? }` | `{ coupon }` | Creates a coupon. Vendors can only create store-scoped coupons (`vendorId` forced to their own). Admins can create global coupons (`vendorId: null`). |
| `POST` | `/api/coupons/validate` | Customer | `{ code, cartTotal, vendorIds[] }` | `{ valid: true, discountAmount, finalTotal, coupon }` | Validates a coupon code against current cart state: checks expiry, usage limits, minimum order, per-user usage, and vendor scope. Returns computed discount amount without consuming the coupon. |
| `GET` | `/api/orders/:id/invoice` | Customer (own) · Vendor (own) · Admin | Path: `orderId`. Query: `?format=pdf` | Binary PDF stream or `{ invoiceUrl }` | Generates a PDFKit invoice on the fly (or returns cached S3 URL). PDF includes: order details, line items, vendor breakdown, tax, discounts, payment reference, QR code. Uploads to S3 and stores URL on Order document for subsequent requests. |

---

### Module 7: Admin Analytics

| Method | Endpoint | Auth Role | Request Body / Params | Response | Description |
|--------|----------|-----------|----------------------|----------|-------------|
| `GET` | `/api/admin/dashboard` | Admin | — | `{ totalUsers, totalVendors, totalOrders, totalRevenue, pendingApprovals, recentOrders[], topVendors[], salesLast7Days[] }` | High-level platform KPI summary. Aggregated using MongoDB `$group` pipelines. Cached in Redis for 5 minutes. |
| `GET` | `/api/admin/users` | Admin | Query: `?page=&limit=&role=&search=&isActive=&startDate=&endDate=` | `{ users[], total, page, pages }` | Paginated user list with full-text search on name/email. Filterable by role and account status. |
| `PUT` | `/api/admin/users/:id/status` | Admin | `{ isActive: boolean, reason? }` | `{ user }` | Activates or suspends a user account. On suspension, invalidates all active JWTs for that user via Redis denylist. |
| `GET` | `/api/admin/vendors` | Admin | Query: `?page=&limit=&isApproved=&search=` | `{ vendors[], total }` | Lists all vendor profiles with their approval status, store details, and earnings. |
| `PUT` | `/api/admin/vendors/:id/approve` | Admin | `{ isApproved: boolean, commissionRate?, reason? }` | `{ vendorProfile }` | Approves or rejects a vendor application. Can set a custom commission rate. Sends email notification to vendor on status change. |
| `GET` | `/api/admin/orders` | Admin | Query: `?page=&limit=&paymentStatus=&startDate=&endDate=&vendorId=&customerId=` | `{ orders[], total, page, pages }` | Returns all platform orders with full customer and vendor details populated. |
| `GET` | `/api/admin/products` | Admin | Query: `?page=&limit=&category=&vendorId=&isActive=&search=` | `{ products[], total }` | Lists all products across all vendors with vendor info. Allows moderation actions. |
| `DELETE` | `/api/admin/products/:id` | Admin | — | `{ message: "Product removed" }` | Hard-deletes a product (admin moderation). Removes from MongoDB and Elasticsearch. Notifies vendor. |
| `GET` | `/api/admin/analytics/revenue` | Admin | Query: `?period=7d\|30d\|90d\|1y&groupBy=day\|week\|month` | `{ labels[], revenue[], commission[], payouts[], netProfit[] }` | Time-series revenue analytics. Aggregated from Order and PaymentSplit collections using MongoDB `$bucket` or `$dateToString` pipeline stages. |
| `GET` | `/api/admin/analytics/top-products` | Admin | Query: `?limit=10&period=30d&by=revenue\|orders\|rating` | `{ products: [{ id, name, vendorName, totalRevenue, totalOrders, avgRating }] }` | Returns top-performing products ranked by selected metric. Aggregated from SubOrder + Product data. |
| `GET` | `/api/admin/analytics/vendor-performance` | Admin | Query: `?page=&limit=&period=30d&sort=revenue\|orders\|rating` | `{ vendors: [{ id, storeName, totalRevenue, commission, totalOrders, avgRating, fulfillmentRate }] }` | Comprehensive vendor performance report showing revenue, commission collected, order volume, ratings, and fulfillment rate. |

---

## 6. Environment Variables Reference

Create a `.env` file at the project root. **Never commit `.env` to version control** — use `.env.example` as a template.

### 6.1 Server Configuration

```env
# General
NODE_ENV=development                        # development | production | test
PORT=5000                                   # Express server port
FRONTEND_URL=http://localhost:5173          # Vite dev server (CORS whitelist)
API_BASE_URL=http://localhost:5000/api      # Self-reference for internal calls
```

### 6.2 MongoDB

```env
# MongoDB Connection
MONGO_URI=mongodb://localhost:27017/multivendor_dev
# For MongoDB Atlas:
# MONGO_URI=mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/multivendor?retryWrites=true&w=majority
MONGO_DB_NAME=multivendor_dev
```

### 6.3 Redis

```env
# Redis Connection (ioredis)
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=                             # Leave blank if no auth
REDIS_TLS=false                             # Set true for Redis Cloud / Upstash
# Full URL alternative (overrides above):
REDIS_URL=redis://127.0.0.1:6379

# Redis Key TTLs (seconds)
REDIS_CART_TTL=604800                       # 7 days
REDIS_SESSION_TTL=900                       # 15 minutes (JWT expiry match)
REDIS_CACHE_TTL=300                         # 5 minutes for dashboard cache
REDIS_CATEGORY_CACHE_TTL=600               # 10 minutes for categories
```

### 6.4 Elasticsearch

```env
# Elasticsearch
ELASTICSEARCH_NODE=http://localhost:9200
# For Elastic Cloud:
# ELASTICSEARCH_CLOUD_ID=deployment:base64==
# ELASTICSEARCH_API_KEY=your_api_key
ELASTICSEARCH_USERNAME=elastic              # Basic auth (local)
ELASTICSEARCH_PASSWORD=changeme
ELASTICSEARCH_INDEX_PRODUCTS=products       # Index name for products
ELASTICSEARCH_INDEX_VENDORS=vendors         # Optional vendor search index
```

### 6.5 AWS S3

```env
# AWS Credentials
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_REGION=ap-south-1                       # e.g., ap-south-1 (Mumbai) or us-east-1

# S3 Bucket Configuration
AWS_S3_BUCKET_NAME=multivendor-ecommerce-assets
AWS_S3_PRESIGNED_URL_EXPIRES=300            # Presigned URL validity in seconds (5 min)
AWS_S3_BASE_URL=https://multivendor-ecommerce-assets.s3.ap-south-1.amazonaws.com
# CloudFront CDN URL (recommended for production):
AWS_CLOUDFRONT_URL=https://d1234567890.cloudfront.net
```

### 6.6 Razorpay

```env
# Razorpay Configuration
RAZORPAY_KEY_ID=rzp_test_XXXXXXXXXXXXXXXX
RAZORPAY_KEY_SECRET=your_razorpay_secret_key
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret  # For verifying webhook payloads
# Razorpay Route (Split Payments)
RAZORPAY_ACCOUNT_NUMBER=your_razorpay_account_number  # For route transfers
```

### 6.7 Stripe

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
STRIPE_PUBLISHABLE_KEY=pk_test_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
STRIPE_WEBHOOK_SECRET=whsec_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX  # From Stripe CLI / Dashboard
# Stripe Connect (Split Payments)
STRIPE_PLATFORM_ACCOUNT_ID=acct_XXXXXXXXXXXXXXXX             # Your platform account
```

### 6.8 JWT

```env
# JSON Web Token
JWT_SECRET=your_super_secret_jwt_key_min_32_chars_long
JWT_EXPIRES_IN=15m                          # Access token expiry
JWT_REFRESH_SECRET=your_super_secret_refresh_key_different_from_above
JWT_REFRESH_EXPIRES_IN=7d                   # Refresh token expiry
```

### 6.9 Email (Nodemailer / SendGrid)

```env
# Email (for notifications)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
EMAIL_FROM="MultiVendor Marketplace <noreply@yourdomain.com>"
# Or SendGrid:
SENDGRID_API_KEY=SG.XXXXXXXXXXXXXXXXXXXXXXXX
```

### 6.10 DummyJSON (Seed Data)

```env
# External Seed Data API
DUMMYJSON_BASE_URL=https://dummyjson.com
DUMMYJSON_PRODUCTS_LIMIT=100               # How many products to seed
```

### 6.11 PDF Invoice

```env
# PDF Invoice Settings
INVOICE_COMPANY_NAME="MultiVendor Marketplace Pvt. Ltd."
INVOICE_COMPANY_ADDRESS="123 Commerce Street, Mumbai, MH 400001, India"
INVOICE_COMPANY_GST=27AABCU9603R1ZX
INVOICE_LOGO_URL=https://yourdomain.com/logo.png
```

---

> [!TIP]
> For local development, copy `.env.example` to `.env` and fill in the values. Use Docker Compose to spin up MongoDB, Redis, and Elasticsearch locally with a single `docker-compose up` command.

> [!CAUTION]
> **Never expose** `JWT_SECRET`, `RAZORPAY_KEY_SECRET`, `STRIPE_SECRET_KEY`, or `AWS_SECRET_ACCESS_KEY` in client-side code, logs, or public repositories. Rotate these immediately if compromised.

---

*Last updated: Auto-generated as part of project initialization. Maintain this document alongside code changes.*

## Database Initialization and Migrations

The backend uses MongoDB through Mongoose. Set `MONGODB_URI` and `JWT_SECRET` in the ignored `server/.env` file; the server does not fall back to an in-memory database or a built-in signing secret. Database credentials and signing secrets must never be placed in client configuration.

Run `npm run migrate` from `server/` to apply the versioned schema initialization explicitly. Server startup applies the same migration before opening the API listener. Migration `001-initialize-schema` creates declared indexes without dropping or synchronizing existing indexes and links existing products to Category documents through the new optional `categoryId` reference. Existing category strings remain available for API compatibility. Duplicate data that prevents a unique index from being created is reported; it is not automatically deleted or rewritten.

`npm start` starts the API only after MongoDB connection and migration succeed. Demo/sample records are not created at startup. The optional `npm run seed` command is separate and does not purge collections.
