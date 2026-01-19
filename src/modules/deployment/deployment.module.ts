import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DeploymentService } from './deployment.service';
import { DeploymentResolver } from './deployment.resolver';
import { Deployment } from '../../infrastructure/database/entities/deployment.entity';
import { VariantModule } from '../variant/variant.module';
import { SchemaModule } from '../schema/schema.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Deployment]),
    forwardRef(() => VariantModule),
    forwardRef(() => SchemaModule),
  ],
  providers: [DeploymentService, DeploymentResolver],
  exports: [DeploymentService],
})
export class DeploymentModule {}
