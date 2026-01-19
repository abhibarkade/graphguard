import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VariantService } from './variant.service';
import { VariantResolver } from './variant.resolver';
import { Variant } from '../../infrastructure/database/entities/variant.entity';
import { CustomerModule } from '../customer/customer.module';
import { SchemaModule } from '../schema/schema.module';
import { DeploymentModule } from '../deployment/deployment.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Variant]),
    forwardRef(() => CustomerModule),
    forwardRef(() => SchemaModule),
    forwardRef(() => DeploymentModule),
  ],
  providers: [VariantService, VariantResolver],
  exports: [VariantService],
})
export class VariantModule {}
