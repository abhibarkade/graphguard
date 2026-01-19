import { Resolver, Query, Mutation, Args, ID, ResolveField, Parent } from '@nestjs/graphql';
import { SchemaValidationResult } from '../../graphql/models/validation.model';
import { Deployment } from '../../infrastructure/database/entities/deployment.entity';
import { SchemaVersion } from '../../infrastructure/database/entities/schema-version.entity';
import { Schema } from '../../infrastructure/database/entities/schema.entity';
import { SchemaService } from './schema.service';

@Resolver(() => SchemaVersion)
export class SchemaResolver {
  constructor(private schemaService: SchemaService) {}

  @Query(() => SchemaVersion, { name: 'activeSchema', nullable: true })
  async getActiveSchema(@Args('variantId', { type: () => ID }) variantId: string): Promise<SchemaVersion | null> {
    return this.schemaService.getActiveSchema(variantId);
  }

  @Query(() => [SchemaVersion], { name: 'schemaHistory' })
  async getSchemaHistory(@Args('schemaId', { type: () => ID }) id: string): Promise<SchemaVersion[]> {
    return this.schemaService.getHistory(id);
  }

  @Query(() => [Deployment], { name: 'deployments' })
  async getDeployments(@Args('variantId', { type: () => ID }) variantId: string): Promise<Deployment[]> {
    return this.schemaService.getDeployments(variantId);
  }

  @Mutation(() => SchemaValidationResult)
  async checkSchema(
    @Args('variantId', { type: () => ID }) variantId: string,
    @Args('schemaSDL') schemaSDL: string,
  ): Promise<SchemaValidationResult> {
    return this.schemaService.checkSchema(variantId, schemaSDL);
  }

  @Mutation(() => Deployment)
  async deploySchema(
    @Args('variantId', { type: () => ID }) variantId: string,
    @Args('schemaName') schemaName: string,
    @Args('schemaSDL') schemaSDL: string,
    @Args('versionLabel') versionLabel: string,
    @Args('dryRun', { defaultValue: false }) dryRun: boolean,
  ): Promise<Deployment> {
    return this.schemaService.deploySchema(variantId, schemaName, schemaSDL, versionLabel, dryRun);
  }

  @Mutation(() => Deployment)
  async rollbackSchema(
    @Args('variantId', { type: () => ID }) variantId: string,
    @Args('targetSchemaVersionId', { type: () => ID }) targetSchemaVersionId: string,
  ): Promise<Deployment> {
    return this.schemaService.rollbackSchema(variantId, targetSchemaVersionId);
  }

  @ResolveField(() => Schema)
  async schema(@Parent() version: SchemaVersion): Promise<Schema> {
    if (version.schema) return version.schema;
    // Note: In a real app we might need to inject or use a dataloader
    return null; 
  }

  @Query(() => String, { name: 'health' })
  health(): string {
    return 'OK';
  }
}

