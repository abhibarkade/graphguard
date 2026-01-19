import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Organization } from '../../infrastructure/database/entities/organization.entity';

@Injectable()
export class OrganizationService {
  constructor(
    @InjectRepository(Organization)
    private organizationRepo: Repository<Organization>,
  ) {}

  async findAll(): Promise<Organization[]> {
    return this.organizationRepo.find({ order: { createdAt: 'DESC' } });
  }

  async findById(id: string): Promise<Organization | null> {
    return this.organizationRepo.findOne({ where: { id } });
  }

  async create(name: string): Promise<Organization> {
    const organization = this.organizationRepo.create({ name });
    return this.organizationRepo.save(organization);
  }
}

