import { Test, TestingModule } from '@nestjs/testing';
import { SchemaService } from './schema.service';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Schema } from '../../infrastructure/database/entities/schema.entity';
import { SchemaVersion } from '../../infrastructure/database/entities/schema-version.entity';
import { Variant } from '../../infrastructure/database/entities/variant.entity';
import { DeploymentService } from '../deployment/deployment.service';
import { ApolloService } from '../../infrastructure/apollo/apollo.service';
import { PinoLogger } from 'nestjs-pino';
import { DeploymentStatus } from '../../graphql/enums/deployment-status.enum';

describe('SchemaService', () => {
  let service: SchemaService;
  let schemaRepo: Repository<Schema>;
  let versionRepo: Repository<SchemaVersion>;
  let variantRepo: Repository<Variant>;
  let deploymentService: DeploymentService;
  let apolloService: ApolloService;
  let pinoLogger: PinoLogger;

  const mockSchemaRepo = {
    findOne: jest.fn(),
    manager: {
      transaction: jest.fn(),
    },
  };

  const mockVersionRepo = {
    find: jest.fn(),
  };

  const mockVariantRepo = {
    findOne: jest.fn(),
  };

  const mockDeploymentService = {
    create: jest.fn(),
    updateStatus: jest.fn(),
    findByVariant: jest.fn(),
  };

  const mockApolloService = {
    checkSchema: jest.fn(),
    publishSchema: jest.fn(),
  };

  const mockPinoLogger = {
    setContext: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SchemaService,
        {
          provide: getRepositoryToken(Schema),
          useValue: mockSchemaRepo,
        },
        {
          provide: getRepositoryToken(SchemaVersion),
          useValue: mockVersionRepo,
        },
        {
          provide: getRepositoryToken(Variant),
          useValue: mockVariantRepo,
        },
        {
          provide: DeploymentService,
          useValue: mockDeploymentService,
        },
        {
          provide: ApolloService,
          useValue: mockApolloService,
        },
        {
          provide: PinoLogger,
          useValue: mockPinoLogger,
        },
      ],
    }).compile();

    service = module.get<SchemaService>(SchemaService);
    schemaRepo = module.get<Repository<Schema>>(getRepositoryToken(Schema));
    versionRepo = module.get<Repository<SchemaVersion>>(getRepositoryToken(SchemaVersion));
    variantRepo = module.get<Repository<Variant>>(getRepositoryToken(Variant));
    deploymentService = module.get<DeploymentService>(DeploymentService);
    apolloService = module.get<ApolloService>(ApolloService);
    pinoLogger = module.get<PinoLogger>(PinoLogger);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('checkSchema', () => {
    it('should return error for empty schema', async () => {
      const result = await service.checkSchema('production', '');

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].code).toBe('EMPTY_SCHEMA');
      expect(mockPinoLogger.warn).toHaveBeenCalledWith(
        { variantName: 'production' },
        'Schema validation failed: empty schema'
      );
    });

    it('should validate schema successfully with Apollo', async () => {
      const mockApolloResponse = {
        isValid: true,
        errors: [],
      };

      mockApolloService.checkSchema.mockResolvedValue(mockApolloResponse);

      const result = await service.checkSchema('production', 'type Query { hello: String }');

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(mockApolloService.checkSchema).toHaveBeenCalledWith(
        'production',
        'inventory',
        'type Query { hello: String }'
      );
      expect(mockPinoLogger.info).toHaveBeenCalledWith(
        { variantName: 'production' },
        'Schema validation successful'
      );
    });

    it('should return Apollo validation errors', async () => {
      const mockApolloResponse = {
        isValid: false,
        errors: [{ message: 'Invalid type definition' }],
      };

      mockApolloService.checkSchema.mockResolvedValue(mockApolloResponse);

      const result = await service.checkSchema('production', 'invalid schema');

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].code).toBe('APOLLO_ERROR');
      expect(mockPinoLogger.warn).toHaveBeenCalled();
    });

    it('should handle Apollo service unavailability', async () => {
      mockApolloService.checkSchema.mockRejectedValue(new Error('Network error'));

      const result = await service.checkSchema('production', 'type Query { hello: String }');

      expect(result.isValid).toBe(false);
      expect(result.errors[0].code).toBe('APOLLO_UNAVAILABLE');
      expect(mockPinoLogger.error).toHaveBeenCalled();
    });
  });

  describe('deploySchema', () => {
    const mockVariant = {
      id: 'variant-uuid-123',
      name: 'production',
    };

    const mockDeployment = {
      id: 'deployment-uuid-456',
      status: DeploymentStatus.PENDING,
    };

    it('should throw error if variant not found', async () => {
      mockVariantRepo.findOne.mockResolvedValue(null);

      await expect(
        service.deploySchema('nonexistent', 'inventory', 'type Query {}', 'v1.0.0', false)
      ).rejects.toThrow('Variant not found: nonexistent');

      expect(mockPinoLogger.error).toHaveBeenCalledWith(
        { variantIdOrName: 'nonexistent' },
        'Variant not found'
      );
    });

    it('should resolve variant by name', async () => {
      mockVariantRepo.findOne.mockResolvedValue(mockVariant);
      mockDeploymentService.create.mockResolvedValue(mockDeployment);
      mockDeploymentService.updateStatus.mockResolvedValue({
        ...mockDeployment,
        status: DeploymentStatus.SUCCEEDED,
      });

      mockSchemaRepo.manager.transaction.mockImplementation(async (callback) => {
        return callback({
          findOne: jest.fn().mockResolvedValue(null),
          save: jest.fn().mockResolvedValue({ id: 'schema-123' }),
          create: jest.fn().mockImplementation((entity, data) => data),
          update: jest.fn(),
          count: jest.fn().mockResolvedValue(0),
        });
      });

      mockApolloService.publishSchema.mockResolvedValue({
        success: true,
        compositionErrors: [],
      });

      await service.deploySchema('production', 'inventory', 'type Query {}', 'v1.0.0', false);

      expect(mockVariantRepo.findOne).toHaveBeenCalledWith({
        where: { name: 'production' },
      });
      expect(mockPinoLogger.debug).toHaveBeenCalledWith(
        { variantId: mockVariant.id, variantName: mockVariant.name },
        'Variant resolved successfully'
      );
    });

    it('should handle dry run deployment', async () => {
      mockVariantRepo.findOne.mockResolvedValue(mockVariant);
      mockDeploymentService.create.mockResolvedValue(mockDeployment);
      mockDeploymentService.updateStatus.mockResolvedValue({
        ...mockDeployment,
        status: DeploymentStatus.SUCCEEDED,
      });

      mockSchemaRepo.manager.transaction.mockImplementation(async (callback) => {
        return callback({
          findOne: jest.fn().mockResolvedValue(null),
          save: jest.fn().mockResolvedValue({ id: 'schema-123' }),
          create: jest.fn().mockImplementation((entity, data) => data),
          count: jest.fn().mockResolvedValue(0),
        });
      });

      const result = await service.deploySchema('production', 'inventory', 'type Query {}', 'v1.0.0', true);

      expect(result.status).toBe(DeploymentStatus.SUCCEEDED);
      expect(mockApolloService.publishSchema).not.toHaveBeenCalled();
    });
  });

  describe('getActiveSchema', () => {
    it('should return active schema version', async () => {
      const mockSchema = {
        id: 'schema-123',
        activeVersionId: 'version-456',
        activeVersion: {
          id: 'version-456',
          schemaSDL: 'type Query { hello: String }',
          versionLabel: 'v1.0.0',
        },
      };

      mockSchemaRepo.findOne.mockResolvedValue(mockSchema);

      const result = await service.getActiveSchema('variant-123');

      expect(result).toEqual(mockSchema.activeVersion);
      expect(mockSchemaRepo.findOne).toHaveBeenCalledWith({
        where: { variantId: 'variant-123' },
        relations: ['activeVersion'],
      });
    });

    it('should return null if no schema found', async () => {
      mockSchemaRepo.findOne.mockResolvedValue(null);

      const result = await service.getActiveSchema('variant-123');

      expect(result).toBeNull();
    });
  });
});
