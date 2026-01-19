# GraphGuard 🛡️

**A Production-Grade Schema Registry & Governance Gateway for Federated GraphQL Microservices**

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)](https://github.com/abhibarkade/graphguard)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Tech Stack: NestJS](https://img.shields.io/badge/Framework-NestJS-red)](https://nestjs.com/)
[![Database: PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL-blue)](https://www.postgresql.org/)

---

## 📋 Table of Contents

- [The Problem](#-the-problem)
- [The Solution](#-the-solution)
- [Architecture](#-architecture)
- [Key Features](#-key-features)
- [Who Benefits](#-who-benefits)
- [Technology Stack](#-technology-stack)
- [Getting Started](#-getting-started)
- [API Documentation](#-api-documentation)
- [Deployment](#-deployment)

---

## 🚨 The Problem

In a federated GraphQL architecture with multiple microservices, teams face critical challenges:

### 1. **Schema Drift & Race Conditions**

Multiple CI/CD pipelines simultaneously pushing schema changes to Apollo Studio creates:

- Conflicting deployments
- Unpredictable composition failures
- No single source of truth

### 2. **Security Vulnerabilities**

- Apollo API keys hardcoded across 15+ microservice repositories
- Exposed credentials in CI/CD configuration files
- No centralized access control or key rotation

### 3. **Lack of Governance**

- No audit trail of who deployed what schema version
- Invalid schemas reaching production
- No rollback mechanism
- Zero visibility into deployment history

### 4. **Operational Complexity**

- Each service team manages their own Apollo integration
- Inconsistent deployment patterns
- Manual coordination required for breaking changes

---

## 💡 The Solution

**GraphGuard** is a centralized Schema Registry that acts as a **governance gateway** between your microservices and Apollo Studio.

### How It Works

Instead of services directly pushing to Apollo Studio:

```
❌ BEFORE: Service → Apollo Studio (Chaos)
✅ AFTER:  Service → GraphGuard → Apollo Studio (Governed)
```

GraphGuard provides:

- **Single Entry Point**: All schema changes flow through one secure gateway
- **Atomic Deployments**: Local registry and Apollo Studio stay perfectly in sync
- **Security Layer**: API key authentication with centralized credential management
- **Complete Audit Trail**: Every schema version, deployment, and rollback is tracked
- **Validation Pipeline**: Schemas are validated before reaching production

---

## 🏗️ Architecture

### Before GraphGuard (The "Wild West")

![Phase 1 Architecture - Before](docs/images/architecture_before.png)

**Problems:**

- Services directly access Apollo Studio
- API keys exposed in every repository
- No coordination between deployments
- Race conditions and conflicts

### After GraphGuard (Governed & Secure)

![Phase 2 Architecture - After](docs/images/architecture_after.png)

**Benefits:**

- Centralized governance gateway
- Secure token-based authentication
- Atomic transactions ensure consistency
- Complete deployment history

---

## 🚀 Key Features

### 🔐 **Security First**

- **API Key Authentication**: Custom `ApiKeyGuard` protects all mutations
- **Secret Isolation**: Apollo credentials stored only in GraphGuard
- **Token Exchange**: Services use revocable GraphGuard tokens
- **Zero Trust**: Every request is authenticated and authorized

### ⚛️ **Atomic Deployments**

```typescript
// Two-Phase Commit Pattern
transaction(async (manager) => {
  // 1. Persist to local PostgreSQL
  const version = await manager.save(SchemaVersion, ...);

  // 2. Sync with Apollo Studio
  await apolloService.publish(schema);

  // 3. Commit (or rollback on failure)
});
```

- Local registry and Apollo Studio are always in sync
- No orphaned records or inconsistent states
- Automatic rollback on upstream failures

### 📜 **Complete Governance**

- **Version Control**: Every schema change is versioned and tracked
- **Deployment History**: Full audit trail with timestamps
- **Rollback Support**: Revert to any previous schema version
- **Validation Pipeline**: Schemas validated before deployment

### ⚡ **High Performance**

- Built on **Fastify** (fastest Node.js framework)
- **Mercurius** for efficient GraphQL processing
- **Redis** caching for frequently accessed data
- Optimized for low-latency schema operations

---

## 👥 Who Benefits

### **Platform Engineering Teams**

- Centralized control over schema governance
- Reduced operational overhead
- Standardized deployment patterns
- Better security posture

### **Microservice Development Teams**

- Simplified CI/CD integration (just call GraphGuard API)
- No need to manage Apollo credentials
- Instant schema validation feedback
- Safe rollback capabilities

### **DevOps/SRE Teams**

- Complete audit trail for compliance
- Automated deployment workflows
- Reduced incident response time
- Better observability

### **Engineering Leadership**

- Enforced governance policies
- Reduced security risks
- Improved developer productivity
- Better change management

---

## 🛠️ Technology Stack

| Component      | Technology          | Why?                                                            |
| -------------- | ------------------- | --------------------------------------------------------------- |
| **Framework**  | NestJS              | Enterprise-grade architecture, dependency injection, modularity |
| **Language**   | TypeScript          | Type safety for complex schema operations                       |
| **Database**   | PostgreSQL          | ACID transactions, relational integrity for versioning          |
| **ORM**        | TypeORM             | Transaction management, migrations, entity relationships        |
| **Cache**      | Redis               | High-performance caching for schema metadata                    |
| **API**        | GraphQL (Mercurius) | Fastify-based GraphQL for low-overhead processing               |
| **HTTP**       | Fastify             | Fastest Node.js web framework                                   |
| **Validation** | Apollo Platform API | Direct integration with Apollo Studio                           |
| **Logging**    | Pino                | High-performance structured logging                             |
| **Metrics**    | Prometheus          | Industry-standard metrics and monitoring                        |
| **Testing**    | Jest                | Comprehensive unit testing with 21+ test cases                  |

---

## 🧪 Testing & Quality

### Running Tests

```bash
# Run all tests
yarn test

# Watch mode for development
yarn test:watch

# Generate coverage report
yarn test:cov
```

### Test Coverage

- **SchemaService**: 10 test cases covering validation, deployment, and error scenarios
- **DeploymentService**: 7 test cases for deployment lifecycle management
- **ApiKeyGuard**: 6 test cases for authentication and authorization
- **Total**: 21 comprehensive unit tests with mocking and edge case coverage

---

## 📊 Observability

### Health Checks

```bash
# Comprehensive health check
GET /health

# Kubernetes liveness probe
GET /health/liveness

# Kubernetes readiness probe
GET /health/readiness
```

### Prometheus Metrics

```bash
# Metrics endpoint for Prometheus scraping
GET /metrics
```

**Available Metrics:**

- `graphguard_schema_validations_total` - Total schema validations by variant and status
- `graphguard_schema_deployments_total` - Total deployments by variant, schema, and status
- `graphguard_deployment_duration_seconds` - Deployment duration histogram
- `graphguard_apollo_sync_total` - Apollo Studio sync operations

### Structured Logging

All operations are logged with structured JSON (production) or pretty-printed (development):

```json
{
  "level": "info",
  "time": 1234567890,
  "variantName": "production",
  "schemaName": "inventory",
  "versionLabel": "v1.2.0",
  "msg": "Schema deployment successful"
}
```

---

## 🏃‍♂️ Getting Started

### Prerequisites

- Node.js 18+
- Docker & Docker Compose
- PostgreSQL 14+
- Redis 7+

### Local Development

1. **Clone the repository**

   ```bash
   git clone https://github.com/abhibarkade/graphguard.git
   cd graphguard
   ```

2. **Install dependencies**

   ```bash
   yarn install
   ```

3. **Configure environment**

   ```bash
   cp .envrc.example .envrc
   # Edit .envrc with your Apollo credentials
   source .envrc
   ```

4. **Start infrastructure**

   ```bash
   docker-compose up -d
   ```

5. **Run the application**

   ```bash
   # Development mode with hot-reload
   yarn start:dev

   # Production build
   yarn build
   yarn start:prod
   ```

6. **Access the application**
   - GraphQL Playground: http://localhost:3000/graphql
   - Health Check: http://localhost:3000/health

---

## 📚 API Documentation

### Authentication

All mutations require the `X-API-KEY` header:

```bash
curl -H "X-API-KEY: your-api-key" http://localhost:3000/graphql
```

### Core Mutations

#### 1. Check Schema

Validate a schema against Apollo Studio before deployment:

```graphql
mutation CheckSchema {
  checkSchema(
    variantId: "production"
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

#### 2. Deploy Schema

Deploy a new schema version:

```graphql
mutation DeploySchema {
  deploySchema(
    variantId: "production"
    schemaName: "inventory"
    schemaSDL: "type Query { products: [Product] }"
    versionLabel: "v1.2.0"
    dryRun: false
  ) {
    id
    status
    startedAt
    finishedAt
  }
}
```

#### 3. Rollback Schema

Revert to a previous schema version:

```graphql
mutation RollbackSchema {
  rollbackSchema(
    variantId: "production"
    targetSchemaVersionId: "uuid-of-previous-version"
  ) {
    id
    status
  }
}
```

### Core Queries

#### Get Active Schema

```graphql
query GetActiveSchema {
  activeSchema(variantId: "production") {
    id
    schemaSDL
    versionLabel
    createdAt
  }
}
```

#### Get Deployment History

```graphql
query GetDeployments {
  deployments(variantId: "production") {
    id
    status
    startedAt
    finishedAt
    schemaVersion {
      versionLabel
    }
  }
}
```

---

## 🚀 Deployment

### Option 1: Zero-Cost Stack (Free Forever)

Perfect for side projects and portfolio demonstrations:

- **Compute**: [Render](https://render.com/) (Free Tier Web Service)
- **Database**: [Neon](https://neon.tech/) (Serverless PostgreSQL)
- **Cache**: [Upstash](https://upstash.com/) (Serverless Redis)

### Option 2: Production (Recommended)

For production workloads:

- **Platform**: Railway, Render (Paid), or GCP Cloud Run
- **Database**: Managed PostgreSQL (AWS RDS, GCP Cloud SQL)
- **Cache**: Managed Redis (AWS ElastiCache, GCP Memorystore)

### Environment Variables

```bash
# Database
DATABASE_URL=postgresql://user:pass@host:5432/graphguard

# Redis
REDIS_URL=redis://host:6379

# Apollo Platform
APOLLO_KEY=service:your-graph:your-key
APOLLO_GRAPH_ID=your-graph-id

# Application
PORT=3000
NODE_ENV=production
```

### Docker Deployment

```bash
# Build image
docker build -t graphguard:latest .

# Run container
docker run -p 3000:3000 \
  -e DATABASE_URL=$DATABASE_URL \
  -e REDIS_URL=$REDIS_URL \
  -e APOLLO_KEY=$APOLLO_KEY \
  graphguard:latest
```

---

## 📁 Project Structure

```
graphguard/
├── src/
│   ├── modules/
│   │   ├── schema/          # Core schema versioning logic
│   │   ├── deployment/      # Deployment orchestration
│   │   ├── variant/         # Graph variant management
│   │   └── organization/    # Multi-tenancy support
│   ├── infrastructure/
│   │   ├── apollo/          # Apollo Platform API integration
│   │   ├── database/        # TypeORM entities & migrations
│   │   ├── cache/           # Redis caching layer
│   │   └── guards/          # Security middleware (ApiKeyGuard)
│   └── config/              # Configuration management
├── docs/
│   └── images/              # Architecture diagrams
├── docker-compose.yml       # Local development setup
└── Dockerfile               # Production container
```

---

## 🤝 Contributing

This project serves as a reference implementation for federated GraphQL governance. Contributions are welcome!

---

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

**Abhi Barkade**

- GitHub: [@abhibarkade](https://github.com/abhibarkade)

---

## 🙏 Acknowledgments

Built with inspiration from:

- Apollo Federation best practices
- Netflix's schema registry patterns
- Distributed systems transaction patterns

---

_GraphGuard - Bringing governance, security, and reliability to federated GraphQL architectures._
