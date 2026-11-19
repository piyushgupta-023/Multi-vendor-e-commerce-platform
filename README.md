# MarketNest

<div align="center">

**A full-stack, multi-vendor e-commerce platform for modern digital marketplaces**

[Quick Start](#quick-start) · [Features](#features) · [Tech Stack](#tech-stack) · [Configuration](#configuration) · [Documentation](#documentation)

</div>

---

## Overview

**MarketNest** is a role-based e-commerce marketplace where customers can discover products and place orders, vendors can manage stores and fulfilments, and administrators can oversee the complete platform.

The repository contains a React and Vite client, an Express and MongoDB API, and optional integrations for Redis, Elasticsearch, AWS S3, Razorpay, Stripe, Google authentication, and Firebase.

---

## Features

### Customer
- Product browsing, search, category filtering, and detailed product pages
- Shopping cart and checkout
- Order history and GST-compliant PDF invoices
- Product reviews and coupon support
- Google, email/password, and phone authentication

### Vendor
- Vendor registration and store profile management
- Product creation and inventory management
- Order and sub-order fulfilment
- Store statistics and earnings overview

### Administrator
- Platform dashboard and revenue analytics
- Vendor approval and account management
- Marketplace monitoring and moderation

### Platform
- Role-based access control for customer, vendor, and administrator accounts
- Redis-backed cart caching with an automatic in-memory fallback
- Elasticsearch product search with a MongoDB text-search fallback
- AWS S3 image storage with a local uploads fallback
- Razorpay and Stripe payment support
- Centralized API validation and error handling

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite 8, React Router 7, Tailwind CSS 4 |
| Backend | Node.js, Express 5 |
| Database | MongoDB, Mongoose 9 |
| Caching | Redis / ioredis |
| Search | Elasticsearch 8 |
| Authentication | JWT, Google OAuth |
| Payments | Razorpay, Stripe |
| Storage | AWS S3 / local file storage |
| Testing | Node.js test runner, mongodb-memory-server |

---

## Project Structure

```text
FS-01-Multi-Vendor-Ecommerce/
├── client/                 # React + Vite storefront
│   └── src/
│       ├── components/     # Shared UI and layout components
│       ├── context/        # Authentication state
│       ├── layouts/        # Vendor layout
│       ├── pages/          # Customer, vendor, and admin pages
│       ├── services/       # API integration
│       └── store/          # Client-side marketplace state
├── server/                 # Express REST API
│   ├── config/             # Database and external service configuration
│   ├── controllers/        # Request handlers
│   ├── middlewares/        # Authentication and request middleware
│   ├── migrations/         # Database migrations
│   ├── models/             # Mongoose models
│   ├── routes/             # API route definitions
│   ├── services/           # Payments, search, storage, Redis, and PDF services
│   └── test/               # Server tests
├── docs/                   # Architecture and API documentation
├── scripts/                # Development process launcher
├── docker-compose.yml      # Optional MongoDB, Redis, and Elasticsearch services
└── package.json            # Workspace-level commands
```

---

## Prerequisites

- Node.js **20.19 or newer**
- npm
- MongoDB, Redis, Elasticsearch, or Docker Desktop as optional infrastructure

The API can run in development without Redis or Elasticsearch because it uses in-memory and MongoDB fallbacks. Development also starts a persistent local MongoDB fallback when no external MongoDB connection is available.

---

## Quick Start

### 1. Install dependencies

From the repository root:

```sh
npm run setup
```

### 2. Configure the server

Create `server/.env` and set at least:

```dotenv
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:5173
JWT_SECRET=replace-with-a-long-random-secret
```

For a local infrastructure setup, add:

```dotenv
MONGODB_URI=mongodb://127.0.0.1:27017/marketplace
REDIS_URL=redis://127.0.0.1:6379
ELASTICSEARCH_URL=http://localhost:9200
```

When `MONGODB_URI` is unavailable in development, the server starts a persistent MongoDB instance under `server/.data/mongodb`.

### 3. Start the application

```sh
npm run dev
```

This starts the API and client together:

| Service | URL |
|---|---|
| Web client | http://localhost:5173 |
| REST API | http://localhost:5000/api |
| Health check | http://localhost:5000/api/health |

Press `Ctrl+C` to stop both processes.

---

## Optional Infrastructure

Docker Compose provides MongoDB, Redis, and Elasticsearch:

```sh
docker compose up -d
```

Stop the services:

```sh
docker compose down
```

Add the Docker connection values from [Configuration](#configuration) to `server/.env`.

---

## Configuration

### Server environment variables

| Variable | Purpose | Required |
|---|---|---|
| `NODE_ENV` | Runtime environment; defaults to development behavior | No |
| `PORT` | API port; defaults to `5000` | No |
| `CLIENT_URL` | Allowed frontend origin; defaults to `http://localhost:5173` | No |
| `JWT_SECRET` | Secret used to sign authentication tokens | **Yes** |
| `JWT_EXPIRES_IN` | Access-token lifetime; defaults to `7d` | No |
| `MONGODB_URI` | MongoDB connection string | In development, fallback available |
| `MONGODB_SERVER_SELECTION_TIMEOUT_MS` | MongoDB connection timeout in milliseconds | No |
| `REDIS_URL` | Redis connection URL; defaults to local Redis | No |
| `ELASTICSEARCH_URL` | Elasticsearch URL; defaults to `http://localhost:9200` | No |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | For Google login |
| `RAZORPAY_KEY_ID` | Razorpay public key | For Razorpay checkout |
| `RAZORPAY_KEY_SECRET` | Razorpay API secret | For Razorpay checkout |
| `STRIPE_SECRET_KEY` | Stripe secret key | For Stripe checkout |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret | For Stripe webhooks |
| `AWS_ACCESS_KEY_ID` | AWS access key | For S3 uploads |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key | For S3 uploads |
| `AWS_REGION` | S3 region; defaults to `ap-south-1` | No |
| `AWS_S3_BUCKET` | S3 bucket name | For S3 uploads |
| `SERVER_URL` | Public API base URL for generated resource URLs | No |

### Client environment variables

Create `client/.env` when custom frontend configuration is required:

| Variable | Purpose |
|---|---|
| `VITE_API_URL` | Production API base URL; development uses `/api` |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth web client ID |
| `VITE_FIREBASE_API_KEY` | Firebase API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase authentication domain |
| `VITE_FIREBASE_PROJECT_ID` | Firebase project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase storage bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase messaging sender ID |
| `VITE_FIREBASE_APP_ID` | Firebase application ID |

Never commit real secrets or production credentials to the repository.

---

## Available Commands

Run these from the repository root:

| Command | Description |
|---|---|
| `npm run setup` | Install client and server dependencies |
| `npm run dev` | Start the client and API together |
| `npm run start` | Alias for `npm run dev` |
| `npm run client` | Start only the Vite client |
| `npm run server` | Start only the API in watch mode |
| `npm run build` | Create the production client build |
| `npm test` | Run the server test suite |
| `npm run start:server` | Start the API without watch mode |

Additional server commands:

```sh
npm --prefix server run migrate
npm --prefix server run seed
```

---

## Testing

Run the server integration tests:

```sh
npm test
```

Create a production frontend build:

```sh
npm run build
```

---

## API and Architecture

The REST API is available through `/api`, with `/api/health` providing service status. Detailed endpoint documentation, role permissions, database models, architecture diagrams, environment configuration, and migration guidance are maintained in [docs/ARCHITECTURE_AND_API.md](docs/ARCHITECTURE_AND_API.md).

---

## Security

- Use strong, unique secrets in every environment.
- Restrict CORS origins to trusted client domains.
- Store provider credentials outside source control.
- Use HTTPS and secure cookies or appropriate token storage in production.
- Add and rotate provider webhook secrets for production payment events.

---

## License

License details for this repository have not been specified.
