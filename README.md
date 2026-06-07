# NovaShop Backend (NestJS API)

Welcome to the backend of **NovaShop**, a robust, high-performance, and secure e-commerce API built with **NestJS**, **TypeORM**, **GraphQL (Apollo)**, and **WebSockets**.

This project provides a comprehensive feature set for user authentication, product catalogs, cart management, checkout orders, and real-time WebRTC video calling.

---

## 🛠️ Tech Stack & Key Technologies

* **Framework:** [NestJS](https://nestjs.com) (v11) - a progressive Node.js framework.
* **API Architectures:** Mixed **REST API** (with OpenAPI/Swagger documentation) & **GraphQL API** (Apollo Driver).
* **Database & ORM:** SQLite database with [TypeORM](https://typeorm.io) for data persistence.
* **Authentication:** JWT Access & Refresh Token rotation, Local authentication strategy (bcrypt), and Google OAuth2 integration.
* **Real-time Signaling:** Socket.io WebSockets for WebRTC video call signaling.
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

6. **`SignalingGateway` (WebSockets)**
   - Manages real-time rooms and peer connection events for WebRTC video calling.

---

## ⚙️ Environment Variables

Create a `.env` file in the root directory and configure the following variables:

```env
DATABASE=database.sqlite
JWT_SECRET=your_jwt_secret_key
JWT_ACCESS_SECRET=your_access_token_secret
JWT_REFRESH_SECRET=your_refresh_token_secret
JWT_EXPIRES_IN=1h
ALLOWED_ORIGINS=http://localhost,http://localhost:3000,http://localhost:8080
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

---

## 🚀 Getting Started

### 1. Installation

Install all required dependencies:
```bash
npm install
```

### 2. Run Database Migrations

Set up the database tables using migrations:
```bash
npm run migration:run
```

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
