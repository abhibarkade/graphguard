import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, OneToMany, Unique, JoinColumn } from 'typeorm';
import { Customer } from './customer.entity';
import { Schema } from './schema.entity';
import { Deployment } from './deployment.entity';
import { ObjectType, Field, ID } from '@nestjs/graphql';

@Entity('variants')
@Unique(['customerId', 'name'])
@ObjectType({ description: 'Variant is the isolation boundary (dev / uat / prod)' })
export class Variant {
  @PrimaryGeneratedColumn('uuid')
  @Field(() => ID)
  id: string;

  @Column()
  @Field()
  name: string;

  @ManyToOne(() => Customer, (customer: Customer) => customer.variants, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'customer_id' })
  @Field(() => Customer)
  customer: Customer;

  @Column({ name: 'customer_id' })
  customerId: string;

  @OneToMany(() => Schema, (schema: Schema) => schema.variant)
  @Field(() => [Schema])
  schemas: Schema[];

  @OneToMany(() => Deployment, (deployment: Deployment) => deployment.variant)
  @Field(() => [Deployment])
  deployments: Deployment[];

  @CreateDateColumn({ name: 'created_at' })
  @Field()
  createdAt: Date;
}
