# What is Prometheus? (Simple Explanation)

## 🎯 In One Sentence

**Prometheus is like a health monitoring system for your application that constantly checks how it's performing and alerts you when something goes wrong.**

---

## 📊 Real-World Analogy

Think of Prometheus like a **fitness tracker** for your application:

- **Fitness Tracker** counts your steps, heart rate, calories → **Prometheus** counts requests, errors, response times
- **Fitness Tracker** shows graphs of your activity → **Prometheus** shows graphs of your app's performance
- **Fitness Tracker** alerts you if heart rate is too high → **Prometheus** alerts you if error rate is too high

---

## 🔍 How It Works (Simple Version)

### 1. **Your App Exposes Metrics**

Your application creates a special `/metrics` endpoint that shows numbers like:

```
http_requests_total = 1523
errors_total = 12
response_time_seconds = 0.25
```

### 2. **Prometheus Scrapes (Collects) These Numbers**

Every few seconds (e.g., every 15 seconds), Prometheus visits your `/metrics` endpoint and saves the numbers.

### 3. **You Can Query and Visualize**

You can ask questions like:

- "How many requests per second am I getting?"
- "What's my error rate in the last hour?"
- "Is my app getting slower?"

### 4. **Alerts When Things Go Wrong**

You can set rules like:

- "Alert me if error rate > 5%"
- "Alert me if response time > 2 seconds"
- "Alert me if app is down"

---

## 🎮 GraphGuard Example

In GraphGuard, we track 4 things:

### 1. **Schema Validations Counter**

```
Question: "How many schemas did we validate?"
Answer: 42 validations (38 success, 4 failed)
```

### 2. **Schema Deployments Counter**

```
Question: "How many schemas did we deploy?"
Answer: 15 deployments (14 success, 1 failed)
```

### 3. **Deployment Duration**

```
Question: "How long do deployments take?"
Answer: Average 0.5 seconds, 95% finish under 1 second
```

### 4. **Apollo Sync Counter**

```
Question: "How many times did we sync with Apollo?"
Answer: 8 syncs (all successful)
```

---

## 🛠️ How You Use It

### Step 1: Your App Exposes Metrics

GraphGuard has a `/metrics` endpoint that shows:

```
# HELP graphguard_schema_validations_total Total number of schema validations
# TYPE graphguard_schema_validations_total counter
graphguard_schema_validations_total{variant="current",status="success"} 42
graphguard_schema_validations_total{variant="current",status="failure"} 4
```

### Step 2: Prometheus Scrapes It

You configure Prometheus to check GraphGuard every 15 seconds:

```yaml
scrape_configs:
  - job_name: "graphguard"
    scrape_interval: 15s
    static_configs:
      - targets: ["localhost:3000"]
```

### Step 3: View in Grafana (Dashboard)

Create beautiful graphs showing:

- Line chart: Validations per minute
- Bar chart: Deployments per service
- Gauge: Current error rate
- Heatmap: Response time distribution

### Step 4: Set Up Alerts

```yaml
# Alert if error rate > 10%
alert: HighErrorRate
expr: rate(graphguard_schema_validations_total{status="failure"}[5m]) > 0.1
```

---

## 💡 Why It's Useful

### Without Prometheus:

- ❌ "Is my app slow?" → Don't know, have to guess
- ❌ "How many errors today?" → Have to dig through logs
- ❌ "When did it break?" → No idea
- ❌ "Is it getting worse?" → Can't tell

### With Prometheus:

- ✅ "Is my app slow?" → Graph shows response time increasing
- ✅ "How many errors today?" → Counter shows 23 errors
- ✅ "When did it break?" → Graph shows spike at 3:15 PM
- ✅ "Is it getting worse?" → Trend shows error rate climbing

---

## 📈 Types of Metrics

### 1. **Counter** (Only Goes Up)

Like a car's odometer - never goes backward

```
Total requests: 1000 → 1001 → 1002 → 1003
Total errors: 5 → 6 → 7 → 8
```

### 2. **Gauge** (Goes Up and Down)

Like a thermometer - can increase or decrease

```
Active users: 50 → 75 → 60 → 80
Memory usage: 2GB → 3GB → 2.5GB
```

### 3. **Histogram** (Distribution of Values)

Like a grade distribution in class

```
Response times:
- 10 requests took 0-100ms
- 50 requests took 100-500ms
- 5 requests took 500ms-1s
```

---

## 🎯 GraphGuard Metrics Breakdown

### Counter: `graphguard_schema_validations_total`

```
Tracks: How many times we validated schemas
Labels:
  - variant: which environment (current, staging)
  - status: success or failure

Example:
graphguard_schema_validations_total{variant="current",status="success"} 42
graphguard_schema_validations_total{variant="current",status="failure"} 4

Meaning: We validated 42 schemas successfully and 4 failed
```

### Counter: `graphguard_schema_deployments_total`

```
Tracks: How many times we deployed schemas
Labels:
  - variant: which environment
  - schema_name: which service (inventory, shipping, tracking)
  - status: success or failure

Example:
graphguard_schema_deployments_total{variant="current",schema_name="inventory",status="success"} 15

Meaning: We deployed the inventory schema 15 times successfully
```

### Histogram: `graphguard_deployment_duration_seconds`

```
Tracks: How long deployments take
Labels:
  - variant: which environment
  - schema_name: which service

Example:
graphguard_deployment_duration_seconds_sum{variant="current",schema_name="inventory"} 7.5
graphguard_deployment_duration_seconds_count{variant="current",schema_name="inventory"} 15

Meaning: 15 deployments took a total of 7.5 seconds (average 0.5 seconds each)
```

### Counter: `graphguard_apollo_sync_total`

```
Tracks: How many times we synced with Apollo Studio
Labels:
  - operation: type of sync (publish, check, fetch)
  - status: success or failure

Example:
graphguard_apollo_sync_total{operation="publish",status="success"} 8

Meaning: We successfully published to Apollo 8 times
```

---

## 🚀 Quick Start

### 1. Check Your Metrics

```bash
curl http://localhost:3000/metrics
```

### 2. Install Prometheus (Docker)

```bash
docker run -p 9090:9090 \
  -v ./prometheus.yml:/etc/prometheus/prometheus.yml \
  prom/prometheus
```

### 3. Configure Prometheus

```yaml
# prometheus.yml
scrape_configs:
  - job_name: "graphguard"
    static_configs:
      - targets: ["host.docker.internal:3000"]
```

### 4. View Metrics

Open http://localhost:9090 and query:

```
rate(graphguard_schema_validations_total[5m])
```

---

## 🎓 Summary

**Prometheus = Monitoring System**

1. **Your app** exposes numbers at `/metrics`
2. **Prometheus** collects these numbers every few seconds
3. **You** query and visualize the data
4. **Alerts** notify you when something is wrong

**In GraphGuard:**

- We track validations, deployments, duration, and Apollo syncs
- All available at `http://localhost:3000/metrics`
- Use Prometheus + Grafana to monitor in production
- Set up alerts for failures and slow performance

---

**Think of it as:** Your app's dashboard showing real-time health and performance! 🏥📊
