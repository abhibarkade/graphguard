import Fastify from 'fastify';

const fastify = Fastify({ logger: true });

fastify.get('/', async () => {
  return { service: 'Tracking Service', status: 'OK' };
});

const start = async () => {
  try {
    await fastify.listen({ port: 4003 });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};
start();
