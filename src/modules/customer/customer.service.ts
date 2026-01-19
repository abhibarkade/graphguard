import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from '../../infrastructure/database/entities/customer.entity';

@Injectable()
export class CustomerService {
  constructor(
    @InjectRepository(Customer)
    private customerRepo: Repository<Customer>,
  ) {}

  async findAllByProject(projectId: string): Promise<Customer[]> {
    return this.customerRepo.find({ where: { projectId }, order: { createdAt: 'DESC' } });
  }

  async findById(id: string): Promise<Customer | null> {
    return this.customerRepo.findOne({ where: { id }, relations: ['project'] });
  }

  async findByExternalId(projectId: string, externalId: string): Promise<Customer | null> {
    return this.customerRepo.findOne({ where: { projectId, externalId } });
  }

  async create(projectId: string, name: string, externalId?: string): Promise<Customer> {
    const customer = this.customerRepo.create({ projectId, name, externalId });
    return this.customerRepo.save(customer);
  }
}

