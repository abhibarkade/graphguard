# GraphGuard

GraphGuard is a high-performance, enterprise-grade GraphQL Schema Registry built with NestJS, Fastify, and TypeORM. It provides a robust boundary for managing schema deployments across organizations, projects, and customers.

## 🚀 Quick Start

### 1. Prerequisites

- **Node.js**: v18 or higher
- **Docker & Colima**: For PostgreSQL and Redis infrastructure.

### 2. Setup Infrastructure

```bash
# Start Docker services via Colima
colima start
yarn docker:infra
```

### 3. Install & Run

```bash
yarn install
yarn dev
```

The app will be running at [http://localhost:3000](http://localhost:3000).
Access the **Apollo Sandbox** (Explorer) at [http://localhost:3000/graphql](http://localhost:3000/graphql).

---

## 📖 Step-by-Step Usage Guide

Follow these steps in the **Apollo Sandbox** to set up your registry from scratch.

### Step 1: Create an Organization

An organization is the top-level owner of all projects.

```graphql
mutation {
  createOrganization(name: "Acme Corp") {
    id
    name
  }
}
```

### Step 2: Create a Project

A project represents a specific API or service within your organization.

```graphql
mutation {
  createProject(organizationId: "PASTE_ORG_ID_HERE", name: "Billing API") {
    id
    name
  }
}
```

### Step 3: Create a Customer

A customer represents an external tenant or consumer of your project.

```graphql
mutation {
  createCustomer(
    projectId: "PASTE_PROJECT_ID_HERE"
    name: "Client A"
    externalId: "client-a"
  ) {
    id
    name
  }
}
```

### Step 4: Create a Variant

A variant is an isolation boundary for environments like `production`, `staging`, or `dev`.

```graphql
mutation {
  createVariant(customerId: "PASTE_CUSTOMER_ID_HERE", name: "production") {
    id
    name
  }
}
```

### Step 5: Deploy a Schema

Upload and activate a schema version for your variant.

```graphql
mutation {
  deploySchema(
    variantId: "PASTE_VARIANT_ID_HERE"
    schemaName: "main"
    schemaSDL: "type Query { hello: String }"
    versionLabel: "v1.0.0"
  ) {
    id
    status
    startedAt
  }
}
```

### Step 6: Verify Active Schema

Check the current active schema for a variant.

```graphql
query {
  variant(id: "PASTE_VARIANT_ID_HERE") {
    name
    schemas {
      name
      activeVersion {
        sdl
        versionLabel
      }
    }
  }
}
```

---

## 🛠 Tech Stack

- **Framework**: [NestJS](https://nestjs.com/)
- **HTTP**: [Fastify](https://www.fastify.io/)
- **GraphQL**: [Apollo Server](https://www.apollographql.com/docs/apollo-server/)
- **Database**: [PostgreSQL](https://www.postgresql.org/) with [TypeORM](https://typeorm.io/)
- **Cache**: [Redis](https://redis.io/)
- **Design**: Code-first GraphQL with modern TypeScript decorators.

---

## 📜 License

MIT
