# GraphGuard - Local Development Guide

## Prerequisites

- Node.js (v18 or higher)
- Yarn or npm
- PostgreSQL (when database is added)
- Redis (when caching is added)

---

## Quick Start

### 1. Install Dependencies

```bash
yarn install
```

### 2. Set Up Environment Variables

```bash
# Copy the example environment file
cp .envrc.example .envrc

# Edit .envrc with your configuration
# If using direnv:
direnv allow

# Or manually load:
source .envrc
```

### 3. Run the Application

```bash
# Development mode with hot reload
yarn dev

# Or using start:dev
yarn start:dev
```

The application will start on `http://localhost:3000`

---

## Two Modes of Development

### Mode 1: Full Docker (Recommended)

Everything runs in Docker - no local Node.js needed.

```bash
docker-compose -f docker-compose.dev.yml up
```

### Mode 2: Hybrid

Run infrastructure in Docker, app locally for faster iteration.

```bash
# Terminal 1: Start infrastructure
docker-compose up -d

# Terminal 2: Run app locally
yarn dev
```

---

## Mode 1: Full Docker Development

### Start Everything

```bash
docker-compose -f docker-compose.dev.yml up
```

This starts:

- **GraphGuard API** on `http://localhost:3000`
- **GraphQL Playground** on `http://localhost:3000/graphql`
- **PostgreSQL** on `localhost:5432`
- **Redis** on `localhost:6379`

### Features

- ✅ Hot reload enabled (changes auto-restart)
- ✅ Consistent environment using Colima or Docker Desktop
- ✅ All services networked automatically

---

## Special Note: Using Colima (Recommended for Mac)

Since you are using **Colima**, ensure it is running before starting Docker:

```bash
colima start
```

Once Colima is running, all standard `docker` and `docker-compose` commands will work as expected.

---

## Mode 2: Hybrid Development (Faster)

### Start Infrastructure Only

```bash
docker-compose up -d
```

### Run App Locally

```bash
# Start app
yarn dev
```

---

## Available Scripts

| Command      | Description                    |
| ------------ | ------------------------------ |
| `yarn dev`   | Run app in development mode    |
| `yarn build` | Build TypeScript to JavaScript |
| `yarn start` | Run production build           |
| `yarn test`  | Run tests (to be implemented)  |

---

## Access Points

- **Apollo Sandbox**: http://localhost:3000/graphql
- **API Endpoint**: http://localhost:3000/graphql (in browser)

---

## Testing GraphQL

Open http://localhost:3000/graphql and try:

### Health Check

```graphql
query {
  health
}
```

### Create Organization

```graphql
mutation {
  createOrganization(name: "Acme Corp") {
    id
    name
    createdAt
  }
}
```

### Check Schema (CI Operation)

```graphql
mutation {
  checkSchema(
    variantId: "variant-123"
    schemaSDL: "type Query { hello: String }"
  ) {
    isValid
    errors {
      code
      message
    }
  }
}
```

### Deploy Schema (CD Operation)

```graphql
mutation {
  deploySchema(
    variantId: "variant-123"
    schemaName: "my-service"
    schemaSDL: "type Query { hello: String }"
    versionLabel: "v1.0.0"
    dryRun: false
  ) {
    id
    status
    startedAt
  }
}
```

---

## Troubleshooting

### Port Already in Use

```bash
# Find and kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port
PORT=3001 yarn dev
```

### Module Not Found

```bash
# Clean install
rm -rf node_modules dist
yarn install
```

### TypeScript Errors

```bash
# Rebuild
yarn build
```

---

## Next Steps

When database and Redis are added:

1. **PostgreSQL** - Will be configured for data persistence
2. **Redis** - Will be configured for caching active schemas
3. **Migrations** - Will be added for database schema management

For now, the application runs with in-memory data structures.

---

## Production Deployment

For production deployment, consider platforms like:

- **Render** (free tier available)
- **Railway**
- **Fly.io**
- **Vercel**
- **AWS ECS/Fargate**

With external databases:

- **Neon** (Postgres - free tier)
- **Supabase** (Postgres - free tier)
- **Upstash** (Redis - free tier)
