import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
import { join } from 'path';
import configuration from './config/configuration';
import { DatabaseModule } from './infrastructure/database/database.module';
import { CacheModule } from './infrastructure/cache/cache.module';
import { HealthModule } from './modules/health/health.module';
import { OrganizationModule } from './modules/organization/organization.module';
import { ProjectModule } from './modules/project/project.module';
import { CustomerModule } from './modules/customer/customer.module';
import { VariantModule } from './modules/variant/variant.module';
import { SchemaModule } from './modules/schema/schema.module';
import { DeploymentModule } from './modules/deployment/deployment.module';
import { ApolloInfrastructureModule } from './infrastructure/apollo/apollo.module';
import { PinoLoggerModule } from './infrastructure/logging/pino-logger.module';


@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),

    // Database
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get<string>('database.url'),
        autoLoadEntities: true,
        synchronize: true, // Only for development
        logging: true,
      }),
      inject: [ConfigService],
    }),

    // GraphQL
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'schema.graphql'),
      sortSchema: true,
      playground: false,
      plugins: [ApolloServerPluginLandingPageLocalDefault()],
    }),

    // Infrastructure
    DatabaseModule,
    CacheModule,
    PinoLoggerModule,

    // Feature Modules
    HealthModule,
    OrganizationModule,
    ProjectModule,
    CustomerModule,
    VariantModule,
    SchemaModule,
    DeploymentModule,
    ApolloInfrastructureModule,
  ],
})
export class AppModule {}
