import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Variant } from './variant.entity';
import { SchemaVersion } from './schema-version.entity';
import { DeploymentStatus } from '../../../graphql/enums/deployment-status.enum';
import { ObjectType, Field, ID } from '@nestjs/graphql';

@Entity('deployments')
@ObjectType({ description: 'Deployment attempt record' })
export class Deployment {
  @PrimaryGeneratedColumn('uuid')
  @Field(() => ID)
  id: string;

  @ManyToOne(() => Variant, (variant: Variant) => variant.deployments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'variant_id' })
  @Field(() => Variant)
  variant: Variant;

  @Column({ name: 'variant_id' })
  @Field()
  variantId: string;

  @ManyToOne(() => SchemaVersion, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'schema_version_id' })
  @Field(() => SchemaVersion)
  schemaVersion: SchemaVersion;

  @Column({ name: 'schema_version_id' })
  @Field()
  schemaVersionId: string;

  @Column({
    type: 'text',
    default: DeploymentStatus.PENDING
  })
  @Field(() => DeploymentStatus)
  status: DeploymentStatus;

  @Column({ name: 'failure_reason', nullable: true, type: 'text' })
  @Field({ nullable: true })
  failureReason: string;

  @CreateDateColumn({ name: 'started_at' })
  @Field()
  startedAt: Date;

  @Column({ name: 'finished_at', nullable: true })
  @Field({ nullable: true })
  finishedAt: Date;
}
