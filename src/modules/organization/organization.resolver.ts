import { Resolver, Query, Mutation, Args, ID, ResolveField, Parent } from '@nestjs/graphql';
import { Module, Inject, forwardRef } from '@nestjs/common';
import { Organization } from '../../infrastructure/database/entities/organization.entity';
import { Project } from '../../infrastructure/database/entities/project.entity';
import { OrganizationService } from './organization.service';
import { ProjectService } from '../project/project.service';

@Resolver(() => Organization)
export class OrganizationResolver {
  constructor(
    private organizationService: OrganizationService,
    @Inject(forwardRef(() => ProjectService))
    private projectService: ProjectService,
  ) {}

  @Query(() => [Organization], { name: 'organizations' })
  async getOrganizations(): Promise<Organization[]> {
    return this.organizationService.findAll();
  }

  @Query(() => Organization, { name: 'organization', nullable: true })
  async getOrganization(@Args('id', { type: () => ID }) id: string): Promise<Organization | null> {
    return this.organizationService.findById(id);
  }

  @Mutation(() => Organization)
  async createOrganization(@Args('name') name: string): Promise<Organization> {
    return this.organizationService.create(name);
  }

  @ResolveField(() => [Project])
  async projects(@Parent() organization: Organization): Promise<Project[]> {
    return this.projectService.findAllByOrganization(organization.id);
  }
}

