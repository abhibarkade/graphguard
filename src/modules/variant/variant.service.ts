import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Variant } from '../../infrastructure/database/entities/variant.entity';

@Injectable()
export class VariantService {
  constructor(
    @InjectRepository(Variant)
    private variantRepo: Repository<Variant>,
  ) {}

  async findAllByCustomer(customerId: string): Promise<Variant[]> {
    return this.variantRepo.find({ where: { customerId }, order: { createdAt: 'DESC' } });
  }

  async findById(id: string): Promise<Variant | null> {
    return this.variantRepo.findOne({ where: { id }, relations: ['customer', 'customer.project'] });
  }

  async findByPath(projectName: string, customerExternalId: string, variantName: string): Promise<Variant | null> {
    return this.variantRepo.findOne({
      where: {
        name: variantName,
        customer: {
          externalId: customerExternalId,
          project: {
            name: projectName
          }
        }
      },
      relations: ['customer', 'customer.project']
    });
  }

  async create(customerId: string, name: string): Promise<Variant> {
    const variant = this.variantRepo.create({ customerId, name });
    return this.variantRepo.save(variant);
  }
}

