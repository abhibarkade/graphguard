import { Resolver, Query, Mutation, Args, ID, ResolveField, Parent } from '@nestjs/graphql';
import { Inject, forwardRef } from '@nestjs/common';
import { Customer } from '../../infrastructure/database/entities/customer.entity';
import { Project } from '../../infrastructure/database/entities/project.entity';
import { Variant } from '../../infrastructure/database/entities/variant.entity';
import { CustomerService } from './customer.service';
import { ProjectService } from '../project/project.service';
import { VariantService } from '../variant/variant.service';

@Resolver(() => Customer)
export class CustomerResolver {
  constructor(
    private customerService: CustomerService,
    @Inject(forwardRef(() => ProjectService))
    private projectService: ProjectService,
    @Inject(forwardRef(() => VariantService))
    private variantService: VariantService,
  ) {}

  @Query(() => Customer, { name: 'customer', nullable: true })
  async getCustomer(@Args('id', { type: () => ID }) id: string): Promise<Customer | null> {
    return this.customerService.findById(id);
  }

  @Query(() => Customer, { name: 'customerByExternalId', nullable: true })
  async getCustomerByExternalId(
    @Args('projectId', { type: () => ID }) projectId: string,
    @Args('externalId') externalId: string,
  ): Promise<Customer | null> {
    return this.customerService.findByExternalId(projectId, externalId);
  }

  @Mutation(() => Customer)
  async createCustomer(
    @Args('projectId', { type: () => ID }) projectId: string,
    @Args('name') name: string,
    @Args('externalId', { nullable: true }) externalId?: string,
  ): Promise<Customer> {
    return this.customerService.create(projectId, name, externalId);
  }

  @ResolveField(() => Project)
  async project(@Parent() customer: Customer): Promise<Project> {
    if (customer.project) return customer.project;
    return this.projectService.findById(customer.projectId);
  }

  @ResolveField(() => [Variant])
  async variants(@Parent() customer: Customer): Promise<Variant[]> {
    return this.variantService.findAllByCustomer(customer.id);
  }
}

