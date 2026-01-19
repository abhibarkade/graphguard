import { Resolver, Query, Mutation, Args, ID, ResolveField, Parent } from '@nestjs/graphql';
import { Inject, forwardRef } from '@nestjs/common';
import { Project } from '../../infrastructure/database/entities/project.entity';
import { Organization } from '../../infrastructure/database/entities/organization.entity';
import { Customer } from '../../infrastructure/database/entities/customer.entity';
import { ProjectService } from './project.service';
import { OrganizationService } from '../organization/organization.service';
import { CustomerService } from '../customer/customer.service';

@Resolver(() => Project)
export class ProjectResolver {
  constructor(
    private projectService: ProjectService,
    @Inject(forwardRef(() => OrganizationService))
    private organizationService: OrganizationService,
    @Inject(forwardRef(() => CustomerService))
    private customerService: CustomerService,
  ) {}

  @Query(() => Project, { name: 'project', nullable: true })
  async getProject(@Args('id', { type: () => ID }) id: string): Promise<Project | null> {
    return this.projectService.findById(id);
  }

  @Mutation(() => Project)
  async createProject(
    @Args('organizationId', { type: () => ID }) organizationId: string,
    @Args('name') name: string,
  ): Promise<Project> {
    return this.projectService.create(organizationId, name);
  }

  @ResolveField(() => Organization)
  async organization(@Parent() project: Project): Promise<Organization> {
    if (project.organization) return project.organization;
    return this.organizationService.findById(project.organizationId);
  }

  @ResolveField(() => [Customer])
  async customers(@Parent() project: Project): Promise<Customer[]> {
    return this.customerService.findAllByProject(project.id);
  }
}

