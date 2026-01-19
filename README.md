# GraphGuard - Production-Ready GraphQL Schema Registry

[![CI](https://github.com/abhibarkade/graphguard/workflows/CI/badge.svg)](https://github.com/abhibarkade/graphguard/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**GraphGuard** is an enterprise-grade, production-ready GraphQL Schema Registry built with NestJS, Fastify, and TypeORM. It provides centralized schema management, validation, versioning, and observability for GraphQL Federation architectures.

## 🎯 Key Features

- **🔐 API Key Authentication** - Secure schema operations with API key-based auth
- **📊 Schema Versioning** - Track and manage schema versions with deployment history
- **✅ Schema Validation** - Validate schemas before deployment with breaking change detection
- **🔄 Apollo Studio Integration** - Seamless sync with Apollo Studio for federated graphs
- **📈 Prometheus Metrics** - Production-grade observability and monitoring
- **🏥 Health Checks** - Comprehensive health endpoints for Kubernetes/Docker
- **📝 Structured Logging** - JSON-structured logs with Pino for production debugging
- **🧪 Comprehensive Testing** - Unit tests with Jest for core services
- **🚀 CI/CD Ready** - GitHub Actions workflows with retry logic

---

## 📋 Table of Contents

- [Quick Start](#-quick-start)
- [Architecture](#-architecture)
- [Prometheus Metrics](#-prometheus-metrics-explained)
- [API Documentation](#-api-documentation)
- [Development](#-development)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [CI/CD Integration](#-cicd-integration)
- [Contributing](#-contributing)

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** >= 18
- **PostgreSQL** >= 14
- **Redis** >= 6
- **Docker** (optional, for local development)

### Installation

```bash
# Clone the repository
git clone https://github.com/abhibarkade/graphguard.git
cd graphguard

# Install dependencies
yarn install

# Set up environment variables
cp .envrc.example .envrc
# Edit .envrc with your configuration

# Start infrastructure (PostgreSQL + Redis)
docker-compose up -d

# Run database migrations (if applicable)
yarn build

# Start the development server
yarn dev
```

The server will start on `http://localhost:3000`

### Docker Development

```bash
# Start everything with Docker Compose
yarn docker:dev

# Rebuild and start
yarn docker:dev:build

# Stop all containers
yarn docker:dev:down
```

---

## 🏗️ Architecture

GraphGuard follows a modular, enterprise-grade architecture:

```
src/
├── modules/
│   ├── schema/          # Schema management (validation, deployment)
│   ├── deployment/      # Deployment history and tracking
│   ├── api-key/         # API key authentication
│   ├── apollo/          # Apollo Studio integration
│   └── health/          # Health checks and metrics
├── common/
│   ├── guards/          # Authentication guards
│   └── interceptors/    # Logging and error handling
└── config/              # Configuration management
```

### Technology Stack

- **Framework**: NestJS with Fastify adapter
- **Database**: PostgreSQL with TypeORM
- **Cache**: Redis with ioredis
- **GraphQL**: Apollo Server with code-first approach
- **Logging**: Pino (structured JSON logging)
- **Metrics**: Prometheus (prom-client)
- **Testing**: Jest with comprehensive coverage

---

## 📈 Prometheus Metrics Explained

GraphGuard exposes production-grade Prometheus metrics for monitoring and observability. All metrics are available at `/metrics` endpoint in Prometheus exposition format.

### Available Metrics

#### 1. **Schema Validations Counter**

```
graphguard_schema_validations_total{variant="current",status="success"} 42
```

- **Type**: Counter
- **Description**: Total number of schema validation operations
- **Labels**:
  - `variant`: The variant ID being validated against (e.g., "current", "staging")
  - `status`: Result of validation ("success" or "failure")
- **Use Case**: Track validation frequency and success rates

#### 2. **Schema Deployments Counter**

```
graphguard_schema_deployments_total{variant="current",schema_name="inventory",status="success"} 15
```

- **Type**: Counter
- **Description**: Total number of schema deployment operations
- **Labels**:
  - `variant`: Target variant ID
  - `schema_name`: Name of the deployed schema/subgraph
  - `status`: Deployment result ("success" or "failure")
- **Use Case**: Monitor deployment frequency per schema and track failures

#### 3. **Deployment Duration Histogram**

```
graphguard_deployment_duration_seconds_bucket{variant="current",schema_name="inventory",le="0.5"} 10
graphguard_deployment_duration_seconds_sum{variant="current",schema_name="inventory"} 3.2
graphguard_deployment_duration_seconds_count{variant="current",schema_name="inventory"} 15
```

- **Type**: Histogram
- **Description**: Duration of schema deployment operations in seconds
- **Labels**:
  - `variant`: Target variant ID
  - `schema_name`: Name of the deployed schema
- **Buckets**: [0.1, 0.5, 1, 2, 5, 10] seconds
- **Use Case**: Analyze deployment performance, identify slow deployments, calculate percentiles (p50, p95, p99)

#### 4. **Apollo Sync Counter**

```
graphguard_apollo_sync_total{operation="publish",status="success"} 8
```

- **Type**: Counter
- **Description**: Total number of Apollo Studio synchronization operations
- **Labels**:
  - `operation`: Type of sync operation ("publish", "check", "fetch")
  - `status`: Operation result ("success" or "failure")
- **Use Case**: Monitor Apollo Studio integration health

### Querying Metrics

#### Prometheus Queries

```promql
# Schema validation success rate (last 5m)
rate(graphguard_schema_validations_total{status="success"}[5m])
/
rate(graphguard_schema_validations_total[5m])

# 95th percentile deployment duration
histogram_quantile(0.95,
  rate(graphguard_deployment_duration_seconds_bucket[5m])
)

# Failed deployments in the last hour
increase(graphguard_schema_deployments_total{status="failure"}[1h])

# Apollo sync error rate
rate(graphguard_apollo_sync_total{status="failure"}[5m])
```

---

## 📚 API Documentation

### GraphQL API

GraphGuard exposes a GraphQL API for schema operations:

#### Check Schema (Validation)

```graphql
mutation CheckSchema {
  checkSchema(variantId: "current", schemaSDL: "type Query { hello: String }") {
    isValid
    errors {
      message
    }
  }
}
```

#### Deploy Schema

```graphql
mutation DeploySchema {
  deploySchema(
    variantId: "current"
    schemaName: "inventory"
    schemaSDL: "type Query { products: [Product] }"
    versionLabel: "v1.0.0"
  ) {
    id
    status
    createdAt
  }
}
```

### REST Endpoints

- `GET /health` - Basic health check
- `GET /health/ready` - Readiness probe (checks DB + Redis)
- `GET /metrics` - Prometheus metrics

---

## 🛠️ Development

### Project Structure

```
graphguard/
├── src/                    # Source code
├── scripts/                # CI/CD scripts
│   ├── schema-check.js     # Schema validation with retry
│   └── schema-publish.js   # Schema deployment with retry
├── .github/workflows/      # GitHub Actions workflows
│   ├── ci.yml              # Main CI pipeline
│   ├── schema-check.yml    # Reusable schema validation
│   ├── schema-publish.yml  # Reusable schema deployment
│   └── logistics-federation/  # Federated service workflows
├── logistics-federation/   # Example federated services
│   └── services/
│       ├── inventory/
│       ├── shipping/
│       └── tracking/
└── docs/                   # Documentation
```

### Environment Variables

```bash
# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=graphguard

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Apollo Studio (optional)
APOLLO_KEY=your-apollo-key
APOLLO_GRAPH_ID=your-graph-id

# Server
PORT=3000
NODE_ENV=development
```

---

## 🧪 Testing

```bash
# Run all tests
yarn test

# Run tests in watch mode
yarn test:watch

# Generate coverage report
yarn test:cov

# Run specific test file
yarn test schema.service.spec.ts
```

### Test Coverage

GraphGuard maintains comprehensive test coverage for:

- ✅ SchemaService - Schema validation and deployment logic
- ✅ DeploymentService - Deployment history and tracking
- ✅ ApiKeyGuard - Authentication and authorization
- ✅ Health checks - Database and Redis connectivity

---

## 🚀 Deployment

### Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Configure production database (managed PostgreSQL)
- [ ] Configure production Redis (managed Redis)
- [ ] Set up API keys for authentication
- [ ] Configure Apollo Studio credentials (if using)
- [ ] Set up Prometheus scraping
- [ ] Configure health check endpoints in load balancer
- [ ] Enable structured logging aggregation
- [ ] Set up alerts for critical metrics

### Docker Production

```dockerfile
# Build
docker build -t graphguard:latest .

# Run
docker run -p 3000:3000 \
  -e DATABASE_HOST=your-db-host \
  -e REDIS_HOST=your-redis-host \
  graphguard:latest
```

### Kubernetes Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: graphguard
spec:
  replicas: 3
  template:
    spec:
      containers:
        - name: graphguard
          image: graphguard:latest
          ports:
            - containerPort: 3000
          env:
            - name: DATABASE_HOST
              valueFrom:
                secretKeyRef:
                  name: graphguard-secrets
                  key: db-host
          livenessProbe:
            httpGet:
              path: /health
              port: 3000
            initialDelaySeconds: 30
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /health/ready
              port: 3000
            initialDelaySeconds: 10
            periodSeconds: 5
```

---

## 🔄 CI/CD Integration

GraphGuard includes production-ready CI/CD workflows with automatic retry logic.

### Schema Validation in CI

The `schema-check.js` script validates schemas with automatic retries:

```yaml
# .github/workflows/my-service-ci.yml
jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: yarn install
      - run: |
          node scripts/schema-check.js \
            --schema-path ./schema.graphql \
            --variant-id current \
            --api-key ${{ secrets.GRAPHGUARD_API_KEY }} \
            --endpoint ${{ secrets.GRAPHGUARD_ENDPOINT }}
```

### Automatic Schema Deployment

On merge to main, schemas are automatically deployed:

```yaml
# .github/workflows/my-service-ci.yml
jobs:
  deploy:
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: yarn install
      - run: |
          node scripts/schema-publish.js \
            --schema-path ./schema.graphql \
            --schema-name my-service \
            --variant-id current \
            --api-key ${{ secrets.GRAPHGUARD_API_KEY }} \
            --endpoint ${{ secrets.GRAPHGUARD_ENDPOINT }} \
            --version-label ${{ github.sha }}
```

### Retry Logic

Both scripts include exponential backoff retry (3 attempts):

- Initial delay: 1 second
- Backoff factor: 2x
- Max delay: 10 seconds
- Total timeout: 30 seconds per attempt

---

## 📖 Example: Federated Services

The `logistics-federation/` directory contains example microservices demonstrating GraphGuard integration:

- **Inventory Service** - Product inventory management
- **Shipping Service** - Order shipping and tracking
- **Tracking Service** - Package tracking and updates

Each service has its own CI workflow that:

1. Validates schema on PRs
2. Deploys schema on merge to main
3. Uses retry logic for resilience

---

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Write tests for new features
- Follow existing code style (NestJS conventions)
- Update documentation for API changes
- Add comments for complex logic
- Ensure CI passes before requesting review

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- Built with [NestJS](https://nestjs.com/)
- Powered by [Fastify](https://www.fastify.io/)
- GraphQL by [Apollo Server](https://www.apollographql.com/docs/apollo-server/)
- Metrics by [prom-client](https://github.com/siimon/prom-client)
- Logging by [Pino](https://getpino.io/)

---

## 📞 Support

For questions, issues, or feature requests:

- Open an [issue](https://github.com/abhibarkade/graphguard/issues)
- Check existing [documentation](./docs/)
- Review [example implementations](./logistics-federation/)

---

**Made with ❤️ for the GraphQL community**
