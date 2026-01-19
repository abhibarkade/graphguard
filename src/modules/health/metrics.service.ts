import { Injectable } from '@nestjs/common';
import { Counter, Histogram, Registry, register } from 'prom-client';

@Injectable()
export class MetricsService {
  private readonly registry: Registry;
  public readonly schemaValidationCounter: Counter;
  public readonly schemaDeploymentCounter: Counter;
  public readonly deploymentDuration: Histogram;
  public readonly apolloSyncCounter: Counter;

  constructor() {
    this.registry = register;

    // Schema validation counter
    this.schemaValidationCounter = new Counter({
      name: 'graphguard_schema_validations_total',
      help: 'Total number of schema validations',
      labelNames: ['variant', 'status'],
      registers: [this.registry],
    });

    // Schema deployment counter
    this.schemaDeploymentCounter = new Counter({
      name: 'graphguard_schema_deployments_total',
      help: 'Total number of schema deployments',
      labelNames: ['variant', 'schema_name', 'status'],
      registers: [this.registry],
    });

    // Deployment duration histogram
    this.deploymentDuration = new Histogram({
      name: 'graphguard_deployment_duration_seconds',
      help: 'Duration of schema deployments in seconds',
      labelNames: ['variant', 'schema_name'],
      buckets: [0.1, 0.5, 1, 2, 5, 10],
      registers: [this.registry],
    });

    // Apollo sync counter
    this.apolloSyncCounter = new Counter({
      name: 'graphguard_apollo_sync_total',
      help: 'Total number of Apollo Studio sync operations',
      labelNames: ['operation', 'status'],
      registers: [this.registry],
    });
  }

  getMetrics(): Promise<string> {
    return this.registry.metrics();
  }

  getRegistry(): Registry {
    return this.registry;
  }
}
