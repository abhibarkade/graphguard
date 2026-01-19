import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Schema } from './schema.entity';
import { ObjectType, Field, ID, Int } from '@nestjs/graphql';
import { SchemaVersionStatus } from '../../../graphql/enums/schema-version-status.enum';

@Entity('schema_versions')
@ObjectType({ description: 'Immutable schema content' })
export class SchemaVersion {
  @PrimaryGeneratedColumn('uuid')
  @Field(() => ID)
  id: string;

  @Column('text')
  @Field()
  schemaSDL: string;

  @Column({ name: 'version_label', nullable: true })
  @Field({ nullable: true })
  versionLabel: string;

  @Column({ name: 'version_order', default: 0 })
  @Field(() => Int)
  versionOrder: number;

  @Column({ default: '' })
  @Field()
  checksum: string;

  @Column({
    type: 'text',
    default: SchemaVersionStatus.ACTIVE
  })
  @Field(() => SchemaVersionStatus)
  status: SchemaVersionStatus;

  @ManyToOne(() => Schema, (schema) => schema.versions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'schema_id' })
  @Field(() => Schema)
  schema: Schema;

  @Column({ name: 'schema_id' })
  schemaId: string;

  @CreateDateColumn({ name: 'created_at' })
  @Field()
  createdAt: Date;
}
