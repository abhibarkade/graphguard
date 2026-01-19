import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SchemaService } from './schema.service';
import { SchemaResolver } from './schema.resolver';
import { Schema } from '../../infrastructure/database/entities/schema.entity';
import { SchemaVersion } from '../../infrastructure/database/entities/schema-version.entity';
import { DeploymentModule } from '../deployment/deployment.module';
import { VariantModule } from '../variant/variant.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Schema, SchemaVersion]),
    forwardRef(() => DeploymentModule),
    forwardRef(() => VariantModule),
  ],
  providers: [SchemaService, SchemaResolver],
  exports: [SchemaService],
})
export class SchemaModule {}
