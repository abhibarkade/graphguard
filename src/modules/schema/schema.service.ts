import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Schema } from '../../infrastructure/database/entities/schema.entity';
import { SchemaVersion } from '../../infrastructure/database/entities/schema-version.entity';
import { Variant } from '../../infrastructure/database/entities/variant.entity';
import { Deployment } from '../../infrastructure/database/entities/deployment.entity';
import { DeploymentStatus } from '../../graphql/enums/deployment-status.enum';
import { SchemaValidationResult } from '../../graphql/models/validation.model';
import { DeploymentService } from '../deployment/deployment.service';
import { ApolloService } from '../../infrastructure/apollo/apollo.service';


@Injectable()
export class SchemaService {
  private readonly logger = new Logger(SchemaService.name);

  constructor(
    @InjectRepository(Schema)
    private schemaRepo: Repository<Schema>,
    @InjectRepository(SchemaVersion)
    private versionRepo: Repository<SchemaVersion>,
    @InjectRepository(Variant)
    private variantRepo: Repository<Variant>,
    private deploymentService: DeploymentService,
    private apolloService: ApolloService,
  ) {}

  async getActiveSchema(variantId: string): Promise<SchemaVersion | null> {
    const schema = await this.schemaRepo.findOne({
      where: { variantId },
      relations: ['activeVersion'],
    });
    return schema?.activeVersion || null;
  }

  async getHistory(schemaId: string): Promise<SchemaVersion[]> {
    return this.versionRepo.find({
      where: { schemaId },
      order: { createdAt: 'DESC' },
    });
  }

  async getDeployments(variantId: string): Promise<Deployment[]> {
    return this.deploymentService.findByVariant(variantId);
  }

  async checkSchema(variantName: string, schemaSDL: string): Promise<SchemaValidationResult> {
    // 1. Internal validation (basic)
    const isValid = schemaSDL.trim().length > 0;
    if (!isValid) {
      return {
        isValid: false,
        errors: [{ code: 'EMPTY_SCHEMA', message: 'Schema SDL cannot be empty' }],
      };
    }

    // 2. Apollo Platform Check
    try {
      // We use 'inventory' as a default for testing, but ideally this should be passed
      const apolloCheck = await this.apolloService.checkSchema(variantName, 'inventory', schemaSDL);
      if (!apolloCheck.isValid && apolloCheck.errors.length > 0) {
         return {
          isValid: false,
          errors: apolloCheck.errors.map(e => ({ code: 'APOLLO_ERROR', message: e.message })),
        };
      }
      return {
        isValid: apolloCheck.isValid,
        errors: [],
      };
    } catch (e) {
      return {
        isValid: false,
        errors: [{ code: 'APOLLO_UNAVAILABLE', message: 'Failed to reach Apollo Studio' }],
      };
    }
  }

  async deploySchema(
    variantIdOrName: string,
    schemaName: string,
    schemaSDL: string,
    versionLabel: string,
    dryRun: boolean,
  ): Promise<Deployment> {
    this.logger.debug(`Deploying schema for variant: ${variantIdOrName}`);
    // Resolve variant first
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(variantIdOrName);
    this.logger.debug(`Is UUID: ${isUuid}`);
    const variant = await this.variantRepo.findOne({
      where: isUuid 
        ? [{ id: variantIdOrName as any }, { name: variantIdOrName }]
        : { name: variantIdOrName },
    });

    if (!variant) {
      throw new Error(`Variant not found: ${variantIdOrName}`);
    }

    return this.schemaRepo.manager.transaction(async (manager) => {
      // 1. Find or create logical schema
      let schema = await manager.findOne(Schema, { where: { variantId: variant.id, name: schemaName } });
      if (!schema) {
        schema = await manager.save(Schema, manager.create(Schema, { variantId: variant.id, name: schemaName }));
      }

      // 2. Create new version
      const version = await manager.save(
        SchemaVersion,
        manager.create(SchemaVersion, {
          schemaId: schema.id,
          schemaSDL,
          versionLabel,
          checksum: Buffer.from(schemaSDL).toString('base64').substring(0, 32),
          versionOrder: (await manager.count(SchemaVersion, { where: { schemaId: schema.id } })) + 1,
        }),
      );

      // 3. Create deployment record
      const deployment = await this.deploymentService.create(variant.id, version.id, manager);

      if (dryRun) {
        return this.deploymentService.updateStatus(deployment.id, DeploymentStatus.SUCCEEDED, undefined, manager);
      }

      // 4. Update active version on schema
      await manager.update(Schema, schema.id, { activeVersionId: version.id });

      // 5. Sync with Apollo Studio
      try {
        const result = await this.apolloService.publishSchema(variant.name, schemaName, schemaSDL, versionLabel);
        if (!result.success) {
          throw new Error(`Apollo Sync Failed: ${result.compositionErrors.map(e => e.message).join(', ')}`);
        }
      } catch (error) {
        // Mark deployment as failed
        await this.deploymentService.updateStatus(deployment.id, DeploymentStatus.FAILED, error.message, manager);
        throw error;
      }

      // 6. Success
      return this.deploymentService.updateStatus(deployment.id, DeploymentStatus.SUCCEEDED, undefined, manager);
    });
  }

  async rollbackSchema(variantId: string, targetSchemaVersionId: string): Promise<Deployment> {
    const version = await this.versionRepo.findOne({
      where: { id: targetSchemaVersionId },
      relations: ['schema'],
    });

    if (!version) {
      throw new Error('Target schema version not found');
    }

    const deployment = await this.deploymentService.create(variantId, version.id);

    // Update active version
    await this.schemaRepo.update(version.schemaId, { activeVersionId: version.id });

    return this.deploymentService.updateStatus(deployment.id, DeploymentStatus.SUCCEEDED);
  }
}

