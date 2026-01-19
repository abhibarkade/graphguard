import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from '../../infrastructure/database/entities/project.entity';

@Injectable()
export class ProjectService {
  constructor(
    @InjectRepository(Project)
    private projectRepo: Repository<Project>,
  ) {}

  async findAllByOrganization(organizationId: string): Promise<Project[]> {
    return this.projectRepo.find({ where: { organizationId }, order: { createdAt: 'DESC' } });
  }

  async findById(id: string): Promise<Project | null> {
    return this.projectRepo.findOne({ where: { id }, relations: ['organization'] });
  }

  async create(organizationId: string, name: string): Promise<Project> {
    const project = this.projectRepo.create({ organizationId, name });
    return this.projectRepo.save(project);
  }
}

