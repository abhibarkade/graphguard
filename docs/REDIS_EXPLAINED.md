# What is Redis? (Simple Explanation)

## 🎯 In One Sentence

**Redis is like a super-fast sticky note board where your application can quickly write and read small pieces of information.**

---

## 📊 Real-World Analogy

Think of Redis like a **whiteboard in your office**:

- **Filing Cabinet** (Database) → Permanent storage, takes time to open drawers and find files
- **Whiteboard** (Redis) → Quick access, write and erase instantly, but temporary
- **Your Desk** (RAM) → Even faster, but disappears when you leave

**Redis = In-Memory Whiteboard for Your App**

---

## 🔍 How It Works (Simple Version)

### 1. **Everything Lives in Memory (RAM)**

- Redis stores data in your computer's RAM (not on disk)
- RAM is 100-1000x faster than disk
- That's why Redis is so fast!

### 2. **Key-Value Storage**

It's like a dictionary or phone book:

```
Key: "user:123:name"  →  Value: "John Doe"
Key: "session:abc"    →  Value: "logged_in_data"
Key: "cache:products" →  Value: "[{id:1, name:'Phone'}]"
```

### 3. **Data Expires Automatically**

You can set expiration times:

```
Set "session:abc" = "user_data" for 30 minutes
After 30 minutes → automatically deleted
```

---

## 🎮 GraphGuard Example

In GraphGuard, we use Redis for **caching**:

### Without Redis (Slow):

```
User requests schema → Check database → Takes 100ms
User requests same schema again → Check database again → Takes 100ms
User requests same schema again → Check database again → Takes 100ms
```

### With Redis (Fast):

```
User requests schema → Check Redis (not found) → Check database → Takes 100ms → Save to Redis
User requests same schema → Check Redis (found!) → Takes 2ms ✨
User requests same schema → Check Redis (found!) → Takes 2ms ✨
```

**Result: 50x faster for repeated requests!**

---

## 💡 Common Use Cases

### 1. **Caching** (Most Common)

Store frequently accessed data temporarily:

```javascript
// Instead of querying database every time
const schema = await redis.get("schema:inventory");
if (!schema) {
  schema = await database.getSchema("inventory"); // Slow
  await redis.set("schema:inventory", schema, "EX", 3600); // Cache for 1 hour
}
```

### 2. **Session Storage**

Store user login sessions:

```javascript
// When user logs in
await redis.set(`session:${sessionId}`, userData, "EX", 86400); // 24 hours

// Check if user is logged in
const session = await redis.get(`session:${sessionId}`);
```

### 3. **Rate Limiting**

Prevent abuse:

```javascript
// Allow only 100 requests per minute
const count = await redis.incr(`rate:${userId}`);
if (count === 1) {
  await redis.expire(`rate:${userId}`, 60); // Expire in 60 seconds
}
if (count > 100) {
  throw new Error("Too many requests");
}
```

### 4. **Pub/Sub (Real-time Messages)**

Send messages between services:

```javascript
// Service A publishes
await redis.publish("schema-updates", "inventory schema changed");

// Service B subscribes
redis.subscribe("schema-updates", (message) => {
  console.log("Received:", message);
});
```

---

## 🛠️ How GraphGuard Uses Redis

### 1. **Schema Caching**

```typescript
// Cache schema validation results
await redis.set(
  `schema:${variantId}:${schemaName}`,
  schemaData,
  "EX",
  3600, // Cache for 1 hour
);
```

### 2. **Deployment History Caching**

```typescript
// Cache recent deployments
await redis.set(
  `deployments:recent`,
  JSON.stringify(recentDeployments),
  "EX",
  300, // Cache for 5 minutes
);
```

### 3. **Health Check**

```typescript
// Verify Redis is working
await redis.ping(); // Returns 'PONG' if healthy
```

---

## 📈 Data Types in Redis

### 1. **String** (Most Common)

```redis
SET user:name "John Doe"
GET user:name
→ "John Doe"
```

### 2. **Hash** (Like Objects)

```redis
HSET user:123 name "John" age "30" email "john@example.com"
HGET user:123 name
→ "John"
```

### 3. **List** (Arrays)

```redis
LPUSH tasks "task1" "task2" "task3"
LRANGE tasks 0 -1
→ ["task3", "task2", "task1"]
```

### 4. **Set** (Unique Values)

```redis
SADD tags "nodejs" "graphql" "typescript"
SMEMBERS tags
→ ["nodejs", "graphql", "typescript"]
```

### 5. **Sorted Set** (Ordered by Score)

```redis
ZADD leaderboard 100 "player1" 200 "player2" 150 "player3"
ZRANGE leaderboard 0 -1 WITHSCORES
→ ["player1", "100", "player3", "150", "player2", "200"]
```

---

## 🚀 Quick Start

### 1. Install Redis (Docker)

```bash
docker run -d -p 6379:6379 redis:latest
```

### 2. Connect from Node.js

```javascript
const Redis = require("ioredis");
const redis = new Redis({
  host: "localhost",
  port: 6379,
});
```

### 3. Basic Operations

```javascript
// Set a value
await redis.set("mykey", "myvalue");

// Get a value
const value = await redis.get("mykey");
console.log(value); // 'myvalue'

// Set with expiration (30 seconds)
await redis.set("tempkey", "tempvalue", "EX", 30);

// Delete a key
await redis.del("mykey");

// Check if key exists
const exists = await redis.exists("mykey"); // 0 or 1
```

---

## ⚡ Why Redis is Fast

### 1. **In-Memory Storage**

- Data stored in RAM (not disk)
- RAM access: ~100 nanoseconds
- Disk access: ~10 milliseconds
- **100,000x faster!**

### 2. **Simple Data Structures**

- No complex queries like SQL
- Direct key-value lookups
- O(1) time complexity for most operations

### 3. **Single-Threaded**

- No locking/unlocking overhead
- No race conditions
- Simpler and faster

---

## 🎯 Redis vs Database

| Feature         | Redis                   | PostgreSQL           |
| --------------- | ----------------------- | -------------------- |
| **Speed**       | ⚡ Super fast (< 1ms)   | 🐢 Slower (10-100ms) |
| **Storage**     | 💾 RAM (temporary)      | 💿 Disk (permanent)  |
| **Data Size**   | 📦 Small (GBs)          | 📚 Large (TBs)       |
| **Persistence** | ⏰ Optional             | ✅ Always            |
| **Use Case**    | 🏃 Cache, sessions      | 🏛️ Main database     |
| **Cost**        | 💰 More expensive (RAM) | 💵 Cheaper (disk)    |

---

## 🔧 GraphGuard Configuration

### Environment Variables

```bash
# Redis connection
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your-password  # Optional
```

### Connection in Code

```typescript
// src/config/redis.config.ts
import { Redis } from "ioredis";

export const redis = new Redis({
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
});
```

---

## 🎓 Summary

**Redis = Super-Fast Temporary Storage**

1. **Stores data in RAM** for lightning-fast access
2. **Key-value pairs** like a dictionary
3. **Automatic expiration** for temporary data
4. **Perfect for caching** frequently accessed data

**In GraphGuard:**

- Cache schema validation results
- Cache deployment history
- Reduce database load
- Speed up API responses by 50-100x

**Think of it as:** Your app's speed booster! 🚀⚡

---

## 📖 Learn More

- [Redis Official Docs](https://redis.io/documentation)
- [Redis Commands](https://redis.io/commands)
- [ioredis (Node.js Client)](https://github.com/luin/ioredis)
