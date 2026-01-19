import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Project } from './project.entity';
import { Variant } from './variant.entity';
import { ObjectType, Field, ID } from '@nestjs/graphql';

@Entity('customers')
@ObjectType({ description: 'Customer represents an external tenant' })
export class Customer {
  @PrimaryGeneratedColumn('uuid')
  @Field(() => ID)
  id: string;

  @Column({ name: 'external_id', unique: true, nullable: true })
  @Field({ nullable: true })
  externalId: string;

  @Column()
  @Field()
  name: string;

  @ManyToOne(() => Project, (project: Project) => project.customers, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  @Field(() => Project)
  project: Project;

  @Column({ name: 'project_id' })
  projectId: string;

  @OneToMany(() => Variant, (variant: Variant) => variant.customer)
  @Field(() => [Variant])
  variants: Variant[];

  @CreateDateColumn({ name: 'created_at' })
  @Field()
  createdAt: Date;
}
