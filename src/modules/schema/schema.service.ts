import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Schema } from '../../infrastructure/database/entities/schema.entity';
import { SchemaVersion } from '../../infrastructure/database/entities/schema-version.entity';
import { Deployment } from '../../infrastructure/database/entities/deployment.entity';
import { DeploymentStatus } from '../../graphql/enums/deployment-status.enum';
import { SchemaValidationResult } from '../../graphql/models/validation.model';
import { DeploymentService } from '../deployment/deployment.service';

@Injectable()
export class SchemaService {
  constructor(
    @InjectRepository(Schema)
    private schemaRepo: Repository<Schema>,
    @InjectRepository(SchemaVersion)
    private versionRepo: Repository<SchemaVersion>,
    private deploymentService: DeploymentService,
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

  async checkSchema(variantId: string, schemaSDL: string): Promise<SchemaValidationResult> {
    // In a real app, we would use graphql-js to validate the SDL
    // For now, we'll just check if it's not empty
    const isValid = schemaSDL.trim().length > 0;
    return {
      isValid,
      errors: isValid ? [] : [{
        code: 'EMPTY_SCHEMA',
        message: 'Schema SDL cannot be empty',
      }],
    };
  }

  async deploySchema(
    variantId: string,
    schemaName: string,
    schemaSDL: string,
    versionLabel: string,
    dryRun: boolean,
  ): Promise<Deployment> {
    // 1. Find or create logical schema
    let schema = await this.schemaRepo.findOne({ where: { variantId, name: schemaName } });
    if (!schema) {
      schema = await this.schemaRepo.save(this.schemaRepo.create({ variantId, name: schemaName }));
    }

    // 2. Create new version
    const version = await this.versionRepo.save(
      this.versionRepo.create({
        schemaId: schema.id,
        schemaSDL,
        versionLabel,
        checksum: 'mock-checksum', // TODO: Implement real checksum
        versionOrder: (await this.versionRepo.count({ where: { schemaId: schema.id } })) + 1,
      }),
    );

    // 3. Create deployment record
    const deployment = await this.deploymentService.create(variantId, version.id);

    if (dryRun) {
      return this.deploymentService.updateStatus(deployment.id, DeploymentStatus.SUCCEEDED);
    }

    // 4. Update active version on schema
    await this.schemaRepo.update(schema.id, { activeVersionId: version.id });

    // 5. Success
    return this.deploymentService.updateStatus(deployment.id, DeploymentStatus.SUCCEEDED);
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

