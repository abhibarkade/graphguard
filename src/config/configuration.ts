export default () => ({
  port: parseInt(process.env.PORT, 10) || 3000,
  database: {
    url: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/graphguard',
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },
  nodeEnv: process.env.NODE_ENV || 'development',
  logLevel: process.env.LOG_LEVEL || 'info',
  apollo: {
    key: process.env.APOLLO_KEY,
    graphId: process.env.APOLLO_GRAPH_ID,
  },
});
