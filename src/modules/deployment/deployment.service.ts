import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Deployment } from '../../infrastructure/database/entities/deployment.entity';
import { DeploymentStatus } from '../../graphql/enums/deployment-status.enum';

@Injectable()
export class DeploymentService {
  constructor(
    @InjectRepository(Deployment)
    private deploymentRepo: Repository<Deployment>,
  ) {}

  async findById(id: string): Promise<Deployment | null> {
    return this.deploymentRepo.findOne({
      where: { id },
      relations: ['variant', 'schemaVersion', 'schemaVersion.schema']
    });
  }

  async create(variantId: string, schemaVersionId: string): Promise<Deployment> {
    const deployment = this.deploymentRepo.create({
      variantId,
      schemaVersionId,
      status: DeploymentStatus.PENDING,
      startedAt: new Date(),
    });
    return this.deploymentRepo.save(deployment);
  }

  async updateStatus(id: string, status: DeploymentStatus, failureReason?: string): Promise<Deployment> {
    await this.deploymentRepo.update(id, {
      status,
      failureReason,
      finishedAt: new Date(),
    });
    return this.findById(id);
  }

  async findByVariant(variantId: string): Promise<Deployment[]> {
    return this.deploymentRepo.find({
      where: { variantId },
      order: { startedAt: 'DESC' },
      relations: ['schemaVersion']
    });
  }
}

