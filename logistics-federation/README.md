# Logistics Federation Monorepo 📦

**Reference Architecture for GraphGuard-governed Microservices.**

This repository demonstrates a **Federated Microservices Architecture** that integrates with the **GraphGuard Registry** for secure, atomic schema deployments.

---

## 🏢 Services

| Service       | Port   | Description                               |
| :------------ | :----- | :---------------------------------------- |
| **Inventory** | `4001` | Manages stock levels and product catalog. |
| **Shipping**  | `4002` | Handles delivery providers and costs.     |
| **Tracking**  | `4003` | Real-time shipment status updates.        |

## 🔄 CI/CD & Governance

This project implements a **Secure Deployment Pipeline**:

1.  **Developer pushes to `main`**.
2.  **GitHub Actions** automates the workflow (`.github/workflows/*.yml`).
3.  **Authentication**: Uses `${{ secrets.GRAPHGUARD_API_KEY }}` to authenticate with the registry.
4.  **Schema Check**: Runs `checkSchema` mutation to validate changes against the Graph.
5.  **Secure Deploy**: Runs `deploySchema` to atomically persist the new version.

```yaml
# Example Workflow Snippet
- name: Deploy Schema
  run: |
    curl -X POST ${{ secrets.GRAPHGUARD_URL }} \
      -H "X-API-KEY: ${{ secrets.GRAPHGUARD_API_KEY }}" \
      -d '{"query": "mutation { deploySchema(...) }"}'
```

## 🔗 Integration

This monorepo is designed to be paired with:
👉 **[GraphGuard Registry](https://github.com/abhibarkade/graphguard)**

## 🚀 Quick Start

1. **Install Dependencies**

   ```bash
   yarn install
   ```

2. **Run All Services**

   ```bash
   yarn start
   ```

3. **Deploy Schemas**
   (Requires running GraphGuard locally on port 3000)
   ```bash
   ./publish-subgraphs.sh
   ```

---

_Reference Implementation for GraphGuard Architecture_
