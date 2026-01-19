import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, OneToMany, Unique, JoinColumn } from 'typeorm';
import { Organization } from './organization.entity';
import { Customer } from './customer.entity';
import { ObjectType, Field, ID } from '@nestjs/graphql';

@Entity('projects')
@Unique(['organizationId', 'name'])
@ObjectType()
export class Project {
  @PrimaryGeneratedColumn('uuid')
  @Field(() => ID)
  id: string;

  @Column()
  @Field()
  name: string;

  @ManyToOne(() => Organization, (organization: Organization) => organization.projects, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organization_id' })
  @Field(() => Organization)
  organization: Organization;

  @Column({ name: 'organization_id' })
  organizationId: string;

  @OneToMany(() => Customer, (customer: Customer) => customer.project)
  @Field(() => [Customer])
  customers: Customer[];

  @CreateDateColumn({ name: 'created_at' })
  @Field()
  createdAt: Date;
}
