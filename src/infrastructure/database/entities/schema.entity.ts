import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, OneToMany, Unique, JoinColumn, OneToOne } from 'typeorm';
import { Variant } from './variant.entity';
import { SchemaVersion } from './schema-version.entity';
import { ObjectType, Field, ID } from '@nestjs/graphql';

@Entity('schemas')
@Unique(['variantId', 'name'])
@ObjectType({ description: 'Logical schema identity' })
export class Schema {
  @PrimaryGeneratedColumn('uuid')
  @Field(() => ID)
  id: string;

  @Column()
  @Field()
  name: string;

  @ManyToOne(() => Variant, (variant: Variant) => variant.schemas, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'variant_id' })
  @Field(() => Variant)
  variant: Variant;

  @Column({ name: 'variant_id' })
  variantId: string;

  @OneToMany(() => SchemaVersion, (version: SchemaVersion) => version.schema)
  @Field(() => [SchemaVersion])
  versions: SchemaVersion[];

  @OneToOne(() => SchemaVersion, { nullable: true })
  @JoinColumn({ name: 'active_version_id' })
  @Field(() => SchemaVersion, { nullable: true })
  activeVersion: SchemaVersion;

  @Column({ name: 'active_version_id', nullable: true })
  activeVersionId: string;

  @CreateDateColumn({ name: 'created_at' })
  @Field()
  createdAt: Date;
}
