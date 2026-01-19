# GraphGuard 🛡️

**A Distributed Schema Registry & Governance Gateway for Federated GraphQL Microservices.**

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)](https://github.com/abhibarkade/graphguard)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Tech Stack: NestJS](https://img.shields.io/badge/Framework-NestJS-red)](https://nestjs.com/)
[![Database: PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL-blue)](https://www.postgresql.org/)

---

## 🏗️ Technical Architecture

GraphGuard acts as the **central authority** for all GraphQL schema changes in a microservices ecosystem. It orchestrates the validation, persistence, and synchronization of schemas between local services and the Apollo Platform.

![GraphGuard Architecture](docs/images/architecture_after.png)

## 🚀 Key Features

- **🛡️ Secure Gateway**: Implements `ApiKeyGuard` relative to RBAC, ensuring only authorized CI pipelines can modify the registry.
- **⚛️ Atomic Deployments**: Utilizes distributed transaction patterns (Two-Phase Commit simulation) to ensure local registry state and Apollo Studio are never out of sync.
- **📜 Strict Governance**: Maintains a complete audit trail of every schema version, preventing "silent drift" in production.
- **⚡ High Performance**: Built on **Fastify** + **Mercurius** for low-overhead schema composition validation.

## 🛠️ Technology Stack

- **Core**: NestJS (Node.js), TypeScript
- **Data**: PostgreSQL, TypeORM, Redis (Caching)
- **API**: GraphQL (Code-First), REST (Health Checks)
- **DevOps**: Docker, GitHub Actions, Secret Management

## 📂 Project Structure

- `src/modules/schema`: Core logic for versioning and deployment.
- `src/infrastructure/apollo`: Custom integration with Apollo Platform APIs.
- `src/infrastructure/guards`: Security middleware implementation.
- `TECHNICAL_CASE_STUDY.md`: **[Deep Dive]** Read the full architectural case study.

## 🏃‍♂️ Running Locally

1. **Clone & Install**

   ```bash
   git clone https://github.com/abhibarkade/graphguard.git
   cd graphguard
   yarn install
   ```

2. **Start Infrastructure (Docker)**

   ```bash
   docker-compose up -d postgres redis
   ```

3. **Run Application**

   ```bash
   # Development Mode
   yarn start:dev
   ```

4. **Access the Graph**
   - **Playground**: `http://localhost:3000/graphql`
   - **Health**: `http://localhost:3000/health`

## 🤝 Contribution

This project serves as a reference implementation for governing Federated GraphQL Architectures.

---

_Created by Abhi Barkade_
