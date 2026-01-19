import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';
import { Project } from './project.entity';
import { ObjectType, Field, ID } from '@nestjs/graphql';

@Entity('organizations')
@ObjectType()
export class Organization {
  @PrimaryGeneratedColumn('uuid')
  @Field(() => ID)
  id: string;

  @Column({ unique: true })
  @Field()
  name: string;

  @CreateDateColumn({ name: 'created_at' })
  @Field()
  createdAt: Date;

  @OneToMany(() => Project, (project: Project) => project.organization)
  @Field(() => [Project])
  projects: Project[];
}
