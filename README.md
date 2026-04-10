# 🚀 Fehmi Corporation Next Proxy Middleware

A powerful **Redis-driven middleware proxy layer for Next.js** that enables dynamic API routing, authentication validation, and request transformation — all directly inside Next.js middleware.

Instead of hardcoding API logic into routes, this middleware allows **centralized API configuration stored in Redis or a database**, making your Next.js app behave like a **lightweight API Gateway**.

Perfect for:

- Microservice architectures
- Multi-tenant platforms
- Dynamic API routing
- Authentication gateways
- Edge middleware security

---

# ✨ Key Features

### ⚡ Dynamic Route Mapping
Routes are resolved dynamically using Redis keys, allowing you to change API behavior **without redeploying your app**.

### 🔐 Built-in Authentication
Supports authentication via:

- JWT tokens
- Secure cookies
- Authorization headers

### 🧠 Smart Request Context Injection
Middleware injects metadata into request headers so downstream handlers can access authentication and routing context easily.

### 🔄 Supports All HTTP Methods

| Method | Purpose |
|------|------|
| GET | Authentication validation |
| POST | Route mapping |
| PUT | Route mapping |
| PATCH | Route mapping |
| DELETE | Route mapping |
| WS | WebSocket routing |

### 🧩 Query-Based Routing
Dynamic routing based on query parameters.

Example:

```

/users?id=10&fnKey=getUser

```

### 🌐 WebSocket Ready
WebSocket connections use the same Redis routing logic as REST requests.

### 🍪 Cookie Management
Integrated helper utilities for setting and validating secure authentication cookies.

---

# 🏗 Architecture

The middleware acts as an **Edge API Gateway** inside your Next.js application.

```

Client Request
│
▼
Next.js Middleware
│
▼
Redis Route Lookup
│
▼
Authentication Validation
│
▼
Header Injection
│
▼
Next.js Route Handler

````

This design allows:

- centralized API configuration
- secure authentication enforcement
- dynamic routing control

---

# 📦 Installation

```bash
npm install @fehmicorp/middleware
````

or

```bash
yarn add @fehmicorp/middleware
```

---

# 🚀 Quick Start

Create a middleware file in your Next.js project.

`middleware.ts`

```ts
import { Proxy } from "@fehmicorp/middleware";

export async function middleware(req: any) {
  return Proxy.handle(req, process.env.REDIS_URL!);
}

export const config = {
  matcher: "/api/:path*"
};
```

This will automatically process every request under `/api`.

---

# 🔑 Request Flow

## POST / PUT / PATCH / DELETE

Write operations require a routing key header.

### Example Request

```
POST /auth/login
x-key: accounts
```

The middleware generates a Redis lookup key.

Example Redis key:

```
accounts
```

Redis response example:

```json
{
  "success": true,
  "data": {
    "module": "accounts",
    "route": "/auth/login"
  }
}
```

Middleware then injects metadata headers:

```
x-auth-key
x-auth-data
x-fn-key
```

---

# 🔐 GET Authentication Flow

GET requests validate user authentication.

Supported authentication sources:

### Authorization Header

```
Authorization: Bearer <token>
```

### Cookie Authentication

```
accounts_token=<jwt>
```

The middleware performs a Redis lookup:

```
jwtToken:auth:<token>
```

Then verifies the JWT using the stored secret.

Headers injected:

```
x-jwt-secret
Authorization
```

---

# 🔍 Query Parameter Routing

Middleware extracts query parameters to determine routing.

Ignored parameters:

```
fnKey
refresh
```

Example request:

```
/users?id=10&fnKey=getUser
```

Generated Redis key:

```
id:10:<x-key>:getUser
```

---

# 🧪 Testing

The repository includes a test harness to simulate middleware execution.

Run tests using:

```bash
npx tsx test/rest.ts
```

This will simulate:

* POST
* PUT
* PATCH
* DELETE
* GET
* WebSocket requests

Example output:

```
TEST: POST route mapping
Redis lookup: accounts
Status: 200
Headers injected successfully
```

---

# 🍪 Cookie Helper

Use the built-in cookie helper to set authentication cookies.

```ts
import { CookieConfig } from "@fehmicorp/middleware";

CookieConfig.setCookie(req, res, token, cookieConfig);
```

---

# 📁 Example Route Configuration

Routes can be stored in Redis or a database.

Example configuration:

```json
{
  "module": "accounts",
  "route": "/auth/login",
  "methods": ["POST"],
  "security": {
    "jwt": {
      "enabled": true,
      "expire": "2h"
    },
    "cookie": {
      "enabled": true,
      "name": "accounts_token"
    }
  }
}
```

---

# 🛡 Security Features

* JWT authentication
* Cookie-based authentication
* Dynamic secret validation
* Header validation
* Query-based routing control
* Optional rate limiting
* CORS configuration support

---

# ⚙️ Use Cases

This middleware is ideal for:

* API gateway inside Next.js
* Microservice routing
* Authentication middleware
* Multi-tenant SaaS platforms
* Edge request processing
* Dynamic API orchestration

---

# 📂 Project Structure

```
src
 ├── index.ts
 ├── get.ts
 ├── post.ts
 ├── put.ts
 ├── patch.ts
 ├── delete.ts
 ├── ws.ts
 └── dist
     ├── cookie.ts
     └── redis.ts

test
 └── rest.ts
```

---

# 🤝 Contributing

Contributions are welcome.

If you'd like to improve this middleware:

1. Fork the repository
2. Create a feature branch
3. Submit a pull request

---

# 📜 License

MIT License

---

# ⭐ Support

If this project helps you, consider giving it a star ⭐ on GitHub.

```

---

✅ This version improves:

- **visual structure**
- **developer onboarding**
- **architecture clarity**
- **professional open-source appearance**

---

If you want, I can also help you add **three powerful sections that make GitHub repos look very professional**:

1️⃣ **Architecture diagram (SVG)**  
2️⃣ **Performance benchmarks vs traditional API routing**  
3️⃣ **Redis key design documentation**

These make your repo look like a **serious infrastructure project rather than a simple middleware library**.
```

## 🧭 Universal Next.js Middleware (dbConf-aware)

If your route config stores a `dbConf` reference (like the `sample-rest.json` file), you can now resolve both route + database configuration dynamically in one middleware.

```ts
import { createUniversalNextMiddleware } from "@fehmicorp/middleware";

const middlewareEngine = createUniversalNextMiddleware({
  basePath: "/api",
  async routeResolver(ctx) {
    // fetch from Redis/DB by pathname + method
    return {
      module: "accounts",
      route: "/auth/login",
      methods: ["POST"],
      dbConf: "692d543f6d4eec947179d1cb"
    };
  },
  async dbConfigResolver(dbConfId) {
    // fetch dbConf dynamically by id
    return {
      id: dbConfId,
      baseUrl: "https://accounts.internal",
      timeoutMs: 20000,
      headers: {
        "x-service": "accounts"
      }
    };
  }
});

export async function middleware(req: Request) {
  return middlewareEngine.handle(req);
}
```

Middleware response headers include:

- `x-proxy-target`
- `x-proxy-module`
- `x-proxy-dbconf-id`
- `x-proxy-timeout`

This enables universal project-level reuse while keeping `dbConf` and route logic fully dynamic.


## 📚 Package documentation

- API usage and examples: [README](./README.md)
- Universal middleware example with `dbConf`: [sample-rest.json](./sample-rest.json)
- Publishing/release guide: [PUBLISHING.md](./PUBLISHING.md)

## 🚢 Publishing

This package is configured for npm publication as `@fehmicorp/middleware`.

```bash
npm run build
npm pack
npm publish --access public
```

> If this is your first publish from a machine, run `npm login` first.
