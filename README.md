# NovaShop Backend (NestJS API)

Welcome to the backend of **NovaShop**, a robust, high-performance, and secure e-commerce API built with **NestJS**, **TypeORM**, and **GraphQL (Apollo)**.

This project provides a comprehensive feature set for user authentication, product catalogs, cart management, and checkout orders.

**Related repositories**

- Frontend (Next.js): [nova-online-shopping-nextjs](https://github.com/Tranloi2k/nextjs-dashboard)
- Live storefront: [nova-online-shopping.vercel.app](https://nova-online-shopping.vercel.app/)

---

## 🛠️ Tech Stack & Key Technologies

* **Framework:** [NestJS](https://nestjs.com) (v11) - a progressive Node.js framework.
* **API Architectures:** Mixed **REST API** (with OpenAPI/Swagger documentation) & **GraphQL API** (Apollo Driver).
* **Database & ORM:** PostgreSQL (Supabase) with [TypeORM](https://typeorm.io) for data persistence.
* **Authentication:** JWT Access & Refresh Token rotation, Local authentication strategy (bcrypt), and Google OAuth2 integration.
* **Linting & Formatting:** ESLint & Prettier.

---

## 🚀 Key Modules & Architecture

1. **`AuthModule`**
   - Implements local sign-in, signup, and Google OAuth flow.
   - Secure token rotation with short-lived JWT Access Tokens and long-lived Refresh Tokens.
   - Auto-generates high-entropy passwords for OAuth sign-ups to prevent authentication bypass.

2. **`UserModule`**
   - Manages user profiles.
   - Implements Class Serialization to automatically exclude password hashes and sensitive tokens from API responses.

3. **`ProductsModule`**
   - Paginated product catalog with filtering (search, category, price bounds, sale status).
   - High-performance sorting (by rating, popularity, newest, and price) executed directly in SQL rather than Node.js memory.

4. **`CartModule`**
   - Manages shopping cart items.
   - Dual interface support: REST endpoints and GraphQL queries/mutations.
   - Protected from IDOR (Insecure Direct Object Reference) vulnerabilities.

5. **`OrderModule`**
   - Handles checkout and order creation with full transactional safety (`DataSource.transaction`).
   - Idempotency guards using Stripe session IDs to prevent duplicate order generation.

---

## ⚙️ Environment Variables

Create a `.env` file in the root directory and configure the following variables:

```env
DATABASE_URL=postgresql://user:password@host:5432/dbname
JWT_ACCESS_SECRET=your_access_token_secret
JWT_REFRESH_SECRET=your_refresh_token_secret
INTERNAL_WEBHOOK_SECRET=your_internal_webhook_secret
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
GOOGLE_CLIENT_ID=your_google_client_id
```

---

## 🚀 Getting Started

### 1. Clone & install

```bash
git clone https://github.com/Tranloi2k/nestjs-app.git Nova-shop-Nestjs
cd Nova-shop-Nestjs
npm install
```

### 2. Bootstrap the database

On a **fresh** PostgreSQL / Supabase project, run the single schema file:

```bash
psql "$DATABASE_URL" -f database/bootstrap.sql
```

Or paste `database/bootstrap.sql` into the Supabase SQL Editor.

> **Warning:** `bootstrap.sql` drops existing Nova Shop tables before recreating them. Do not run on production unless you intend to wipe data.

TypeORM uses `synchronize: false` — schema changes must be applied via `database/bootstrap.sql` (fresh setup) or Supabase migrations (ongoing).

### 3. Start the Server

```bash
# Development (with auto-watch)
npm run start:dev

# Production build & run
npm run build
npm run start:prod
```

Once running, the API will be available at `http://localhost:5000`.

* **REST Swagger UI:** [http://localhost:5000/api](http://localhost:5000/api)
* **GraphQL Playground:** [http://localhost:5000/graphql](http://localhost:5000/graphql)

---

## 🧪 Testing

Run unit and end-to-end tests:

```bash
# Run all unit tests
npm run test

# Run e2e tests
npm run test:e2e
```

---

## 👨‍💻 Author

**Tran Loi**

- GitHub: [@Tranloi2k](https://github.com/Tranloi2k)
- Email: tranloi20001007@gmail.com