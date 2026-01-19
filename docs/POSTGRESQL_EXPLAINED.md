# What is PostgreSQL? (Simple Explanation)

## 🎯 In One Sentence

**PostgreSQL is like a super-organized filing cabinet that permanently stores all your application's important data in tables.**

---

## 📊 Real-World Analogy

Think of PostgreSQL like a **library**:

- **Books** = Your data (users, schemas, deployments)
- **Shelves** = Tables (organized by category)
- **Card Catalog** = Indexes (find books quickly)
- **Librarian** = PostgreSQL (manages everything)
- **Library Rules** = Constraints (ensure data quality)

---

## 🔍 How It Works (Simple Version)

### 1. **Tables Store Data in Rows and Columns**

Like an Excel spreadsheet:

**Users Table:**
| id | name | email | created_at |
|----|------|-------|------------|
| 1 | John | john@example.com | 2024-01-15 |
| 2 | Jane | jane@example.com | 2024-01-16 |
| 3 | Bob | bob@example.com | 2024-01-17 |

### 2. **SQL Queries to Get Data**

Ask questions in SQL language:

```sql
-- Get all users
SELECT * FROM users;

-- Get user by email
SELECT * FROM users WHERE email = 'john@example.com';

-- Count total users
SELECT COUNT(*) FROM users;
```

### 3. **Relationships Between Tables**

Tables can reference each other:

**Schemas Table:**
| id | name | variant_id | created_by_user_id |
|----|------|------------|-------------------|
| 1 | inventory | current | 1 |
| 2 | shipping | current | 2 |

```sql
-- Get schema with user who created it
SELECT schemas.name, users.name as creator
FROM schemas
JOIN users ON schemas.created_by_user_id = users.id;
```

---

## 🎮 GraphGuard Example

In GraphGuard, PostgreSQL stores everything permanently:

### Tables We Use:

#### 1. **Schemas Table**

Stores GraphQL schemas:

```sql
CREATE TABLE schemas (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  variant_id VARCHAR(255) NOT NULL,
  schema_sdl TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### 2. **Deployments Table**

Tracks deployment history:

```sql
CREATE TABLE deployments (
  id SERIAL PRIMARY KEY,
  schema_id INTEGER REFERENCES schemas(id),
  version_label VARCHAR(255),
  status VARCHAR(50),
  deployed_at TIMESTAMP DEFAULT NOW()
);
```

#### 3. **API Keys Table**

Stores authentication keys:

```sql
CREATE TABLE api_keys (
  id SERIAL PRIMARY KEY,
  key_hash VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP
);
```

---

## 💡 Why PostgreSQL?

### 1. **ACID Compliance** (Reliable)

- **Atomicity**: All or nothing (no partial saves)
- **Consistency**: Data always valid
- **Isolation**: Transactions don't interfere
- **Durability**: Once saved, never lost

**Example:**

```sql
-- Transfer money between accounts
BEGIN;
  UPDATE accounts SET balance = balance - 100 WHERE id = 1;
  UPDATE accounts SET balance = balance + 100 WHERE id = 2;
COMMIT;
-- Both updates succeed or both fail (never just one)
```

### 2. **Powerful Queries**

```sql
-- Complex query with joins, filters, and aggregation
SELECT
  schemas.name,
  COUNT(deployments.id) as deployment_count,
  MAX(deployments.deployed_at) as last_deployment
FROM schemas
LEFT JOIN deployments ON schemas.id = deployments.schema_id
WHERE schemas.variant_id = 'current'
GROUP BY schemas.name
HAVING COUNT(deployments.id) > 5
ORDER BY deployment_count DESC;
```

### 3. **Data Integrity**

```sql
-- Constraints ensure data quality
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,  -- Must be unique
  age INTEGER CHECK (age >= 18),        -- Must be 18+
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🛠️ How GraphGuard Uses PostgreSQL

### 1. **Store Schemas**

```typescript
// Save a new schema
await db.query(
  `
  INSERT INTO schemas (name, variant_id, schema_sdl)
  VALUES ($1, $2, $3)
  RETURNING id
`,
  [schemaName, variantId, schemaSDL],
);
```

### 2. **Track Deployments**

```typescript
// Record a deployment
await db.query(
  `
  INSERT INTO deployments (schema_id, version_label, status)
  VALUES ($1, $2, $3)
`,
  [schemaId, versionLabel, "success"],
);
```

### 3. **Validate API Keys**

```typescript
// Check if API key is valid
const result = await db.query(
  `
  SELECT * FROM api_keys
  WHERE key_hash = $1
  AND (expires_at IS NULL OR expires_at > NOW())
`,
  [keyHash],
);
```

### 4. **Get Deployment History**

```typescript
// Get recent deployments
const deployments = await db.query(`
  SELECT 
    d.id,
    d.version_label,
    d.deployed_at,
    s.name as schema_name
  FROM deployments d
  JOIN schemas s ON d.schema_id = s.id
  ORDER BY d.deployed_at DESC
  LIMIT 10
`);
```

---

## 📈 Common SQL Operations

### 1. **CREATE** (Insert Data)

```sql
INSERT INTO users (name, email)
VALUES ('John Doe', 'john@example.com');
```

### 2. **READ** (Query Data)

```sql
SELECT name, email FROM users WHERE id = 1;
```

### 3. **UPDATE** (Modify Data)

```sql
UPDATE users
SET email = 'newemail@example.com'
WHERE id = 1;
```

### 4. **DELETE** (Remove Data)

```sql
DELETE FROM users WHERE id = 1;
```

---

## 🚀 Quick Start

### 1. Install PostgreSQL (Docker)

```bash
docker run -d \
  -p 5432:5432 \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=graphguard \
  postgres:14
```

### 2. Connect from Node.js (TypeORM)

```typescript
import { DataSource } from "typeorm";

const AppDataSource = new DataSource({
  type: "postgres",
  host: "localhost",
  port: 5432,
  username: "postgres",
  password: "postgres",
  database: "graphguard",
  entities: [Schema, Deployment, ApiKey],
  synchronize: true, // Auto-create tables (dev only)
});
```

### 3. Define Entities

```typescript
import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity("schemas")
export class Schema {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  variant_id: string;

  @Column("text")
  schema_sdl: string;

  @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  created_at: Date;
}
```

### 4. Use in Code

```typescript
// Save a schema
const schema = new Schema();
schema.name = "inventory";
schema.variant_id = "current";
schema.schema_sdl = "type Query { ... }";
await schemaRepository.save(schema);

// Find schemas
const schemas = await schemaRepository.find({
  where: { variant_id: "current" },
});
```

---

## ⚡ PostgreSQL Features

### 1. **Indexes** (Speed Up Queries)

```sql
-- Create index for faster lookups
CREATE INDEX idx_schemas_variant ON schemas(variant_id);

-- Now this query is much faster
SELECT * FROM schemas WHERE variant_id = 'current';
```

### 2. **Transactions** (All or Nothing)

```sql
BEGIN;
  INSERT INTO schemas (...) VALUES (...);
  INSERT INTO deployments (...) VALUES (...);
COMMIT;  -- Both succeed or both fail
```

### 3. **Foreign Keys** (Relationships)

```sql
CREATE TABLE deployments (
  id SERIAL PRIMARY KEY,
  schema_id INTEGER REFERENCES schemas(id) ON DELETE CASCADE
);
-- If schema is deleted, all its deployments are also deleted
```

### 4. **JSON Support** (Flexible Data)

```sql
CREATE TABLE metadata (
  id SERIAL PRIMARY KEY,
  data JSONB  -- Store JSON directly
);

INSERT INTO metadata (data)
VALUES ('{"tags": ["graphql", "api"], "version": "1.0"}');

-- Query JSON fields
SELECT * FROM metadata WHERE data->>'version' = '1.0';
```

---

## 🎯 PostgreSQL vs Redis

| Feature           | PostgreSQL           | Redis                 |
| ----------------- | -------------------- | --------------------- |
| **Purpose**       | 🏛️ Main database     | 🏃 Cache/temp storage |
| **Storage**       | 💿 Disk (permanent)  | 💾 RAM (temporary)    |
| **Speed**         | 🐢 Slower (10-100ms) | ⚡ Super fast (< 1ms) |
| **Data Size**     | 📚 Large (TBs)       | 📦 Small (GBs)        |
| **Queries**       | 🔍 Complex SQL       | 🔑 Simple key-value   |
| **Relationships** | ✅ Yes (joins)       | ❌ No                 |
| **ACID**          | ✅ Yes               | ⚠️ Limited            |

**Use Both Together:**

- PostgreSQL: Store everything permanently
- Redis: Cache frequently accessed data

---

## 🔧 GraphGuard Configuration

### Environment Variables

```bash
# PostgreSQL connection
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=graphguard
```

### TypeORM Configuration

```typescript
// src/config/database.config.ts
import { TypeOrmModuleOptions } from "@nestjs/typeorm";

export const databaseConfig: TypeOrmModuleOptions = {
  type: "postgres",
  host: process.env.DATABASE_HOST || "localhost",
  port: parseInt(process.env.DATABASE_PORT) || 5432,
  username: process.env.DATABASE_USER || "postgres",
  password: process.env.DATABASE_PASSWORD || "postgres",
  database: process.env.DATABASE_NAME || "graphguard",
  entities: [__dirname + "/../**/*.entity{.ts,.js}"],
  synchronize: process.env.NODE_ENV !== "production",
  logging: process.env.NODE_ENV === "development",
};
```

---

## 🎓 Summary

**PostgreSQL = Permanent, Organized Storage**

1. **Tables with rows and columns** like spreadsheets
2. **SQL queries** to get and modify data
3. **ACID compliance** for reliability
4. **Relationships** between tables
5. **Powerful features** like indexes, transactions, JSON

**In GraphGuard:**

- Store all schemas permanently
- Track deployment history
- Manage API keys
- Ensure data integrity with constraints

**Think of it as:** Your app's permanent memory! 🧠💾

---

## 📖 Learn More

- [PostgreSQL Official Docs](https://www.postgresql.org/docs/)
- [TypeORM Documentation](https://typeorm.io/)
- [SQL Tutorial](https://www.w3schools.com/sql/)
