import { Resolver, ResolveField, Parent } from '@nestjs/graphql';
import { Inject, forwardRef } from '@nestjs/common';
import { Deployment } from '../../infrastructure/database/entities/deployment.entity';
import { Variant } from '../../infrastructure/database/entities/variant.entity';
import { SchemaVersion } from '../../infrastructure/database/entities/schema-version.entity';
import { DeploymentService } from './deployment.service';
import { VariantService } from '../variant/variant.service';
import { SchemaService } from '../schema/schema.service';

@Resolver(() => Deployment)
export class DeploymentResolver {
  constructor(
    private deploymentService: DeploymentService,
    @Inject(forwardRef(() => VariantService))
    private variantService: VariantService,
    @Inject(forwardRef(() => SchemaService))
    private schemaService: SchemaService,
  ) {}

  @ResolveField(() => Variant)
  async variant(@Parent() deployment: Deployment): Promise<Variant> {
    if (deployment.variant) return deployment.variant;
    return this.variantService.findById(deployment.variantId);
  }

  @ResolveField(() => SchemaVersion)
  async schemaVersion(@Parent() deployment: Deployment): Promise<SchemaVersion> {
    if (deployment.schemaVersion) return deployment.schemaVersion;
    // Note: SchemaVersion fetch logic might be needed here
    return null;
  }
}

