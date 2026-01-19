# GraphGuard - Quick Start

## Docker Commands

### Full Environment (App + Infra)

```bash
yarn docker:dev
```

### Infrastructure Only (Postgres + Redis)

```bash
yarn docker:infra
```

### Stop Everything

```bash
yarn docker:dev:down
```

---

## Setup (Local Mode)

The application will be available at http://localhost:3000

---

## Available Scripts

| Command      | Description                    |
| ------------ | ------------------------------ |
| `yarn dev`   | Run app in development mode    |
| `yarn build` | Build TypeScript to JavaScript |
| `yarn start` | Run production build           |

---

## Access Points

- **Apollo Sandbox**: http://localhost:3000/graphql
- **API Endpoint**: http://localhost:3000/graphql

---

## Quick Test

Open http://localhost:3000/graphql in your browser and run:

```graphql
query {
  health
}
```

You should see a successful response indicating the server is running.

---

## Next Steps

1. **Explore the API** - Use the GraphQL Playground to test mutations and queries
2. **Read the docs** - Check `LOCAL_DEV.md` for detailed development guide
3. **Review the architecture** - See `README.md` for system design

---

## Need Help?

- Check `LOCAL_DEV.md` for troubleshooting
- Review `README.md` for architecture overview
- Ensure all environment variables are set correctly in `.envrc`
