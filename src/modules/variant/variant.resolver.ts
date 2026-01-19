import { Resolver, Query, Mutation, Args, ID, ResolveField, Parent } from '@nestjs/graphql';
import { Inject, forwardRef } from '@nestjs/common';
import { Variant } from '../../infrastructure/database/entities/variant.entity';
import { Customer } from '../../infrastructure/database/entities/customer.entity';
import { Schema } from '../../infrastructure/database/entities/schema.entity';
import { Deployment } from '../../infrastructure/database/entities/deployment.entity';
import { VariantService } from './variant.service';
import { CustomerService } from '../customer/customer.service';
import { SchemaService } from '../schema/schema.service';
import { DeploymentService } from '../deployment/deployment.service';

@Resolver(() => Variant)
export class VariantResolver {
  constructor(
    private variantService: VariantService,
    @Inject(forwardRef(() => CustomerService))
    private customerService: CustomerService,
    @Inject(forwardRef(() => SchemaService))
    private schemaService: SchemaService,
    @Inject(forwardRef(() => DeploymentService))
    private deploymentService: DeploymentService,
  ) {}

  @Query(() => Variant, { name: 'variant', nullable: true })
  async getVariant(@Args('id', { type: () => ID }) id: string): Promise<Variant | null> {
    return this.variantService.findById(id);
  }

  @Query(() => Variant, { name: 'variantByPath', nullable: true })
  async getVariantByPath(
    @Args('projectName') projectName: string,
    @Args('customerExternalId') customerExternalId: string,
    @Args('variantName') variantName: string,
  ): Promise<Variant | null> {
    return this.variantService.findByPath(projectName, customerExternalId, variantName);
  }

  @Mutation(() => Variant)
  async createVariant(
    @Args('customerId', { type: () => ID }) customerId: string,
    @Args('name') name: string,
  ): Promise<Variant> {
    return this.variantService.create(customerId, name);
  }

  @ResolveField(() => Customer)
  async customer(@Parent() variant: Variant): Promise<Customer> {
    if (variant.customer) return variant.customer;
    return this.customerService.findById(variant.customerId);
  }

  @ResolveField(() => [Schema])
  async schemas(@Parent() variant: Variant): Promise<Schema[]> {
    return []; // For now, logic handled by SchemaService if needed
  }

  @ResolveField(() => [Deployment])
  async deployments(@Parent() variant: Variant): Promise<Deployment[]> {
    return this.deploymentService.findByVariant(variant.id);
  }
}

