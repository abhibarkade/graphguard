import { Test, TestingModule } from '@nestjs/testing';
import { DeploymentService } from './deployment.service';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Deployment } from '../../infrastructure/database/entities/deployment.entity';
import { DeploymentStatus } from '../../graphql/enums/deployment-status.enum';

describe('DeploymentService', () => {
  let service: DeploymentService;
  let deploymentRepo: Repository<Deployment>;

  const mockDeploymentRepo = {
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    getRepository: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeploymentService,
        {
          provide: getRepositoryToken(Deployment),
          useValue: mockDeploymentRepo,
        },
      ],
    }).compile();

    service = module.get<DeploymentService>(DeploymentService);
    deploymentRepo = module.get<Repository<Deployment>>(getRepositoryToken(Deployment));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new deployment with PENDING status', async () => {
      const mockDeployment = {
        id: 'deployment-123',
        variantId: 'variant-456',
        schemaVersionId: 'version-789',
        status: DeploymentStatus.PENDING,
        startedAt: new Date(),
      };

      mockDeploymentRepo.create.mockReturnValue(mockDeployment);
      mockDeploymentRepo.save.mockResolvedValue(mockDeployment);

      const result = await service.create('variant-456', 'version-789');

      expect(result).toEqual(mockDeployment);
      expect(mockDeploymentRepo.create).toHaveBeenCalledWith({
        variantId: 'variant-456',
        schemaVersionId: 'version-789',
        status: DeploymentStatus.PENDING,
        startedAt: expect.any(Date),
      });
      expect(mockDeploymentRepo.save).toHaveBeenCalledWith(mockDeployment);
    });

    it('should use provided entity manager for transaction', async () => {
      const mockManager = {
        getRepository: jest.fn().mockReturnValue({
          create: jest.fn().mockReturnValue({ id: 'deployment-123' }),
          save: jest.fn().mockResolvedValue({ id: 'deployment-123' }),
        }),
      };

      await service.create('variant-456', 'version-789', mockManager as any);

      expect(mockManager.getRepository).toHaveBeenCalledWith(Deployment);
    });
  });

  describe('updateStatus', () => {
    it('should update deployment status to SUCCEEDED', async () => {
      const mockDeployment = {
        id: 'deployment-123',
        status: DeploymentStatus.SUCCEEDED,
        finishedAt: new Date(),
      };

      mockDeploymentRepo.update.mockResolvedValue({ affected: 1 });
      mockDeploymentRepo.findOne.mockResolvedValue(mockDeployment);

      const result = await service.updateStatus('deployment-123', DeploymentStatus.SUCCEEDED);

      expect(result).toEqual(mockDeployment);
      expect(mockDeploymentRepo.update).toHaveBeenCalledWith('deployment-123', {
        status: DeploymentStatus.SUCCEEDED,
        failureReason: undefined,
        finishedAt: expect.any(Date),
      });
    });

    it('should update deployment status to FAILED with reason', async () => {
      const mockDeployment = {
        id: 'deployment-123',
        status: DeploymentStatus.FAILED,
        failureReason: 'Apollo sync failed',
        finishedAt: new Date(),
      };

      mockDeploymentRepo.update.mockResolvedValue({ affected: 1 });
      mockDeploymentRepo.findOne.mockResolvedValue(mockDeployment);

      const result = await service.updateStatus(
        'deployment-123',
        DeploymentStatus.FAILED,
        'Apollo sync failed'
      );

      expect(result.failureReason).toBe('Apollo sync failed');
      expect(mockDeploymentRepo.update).toHaveBeenCalledWith('deployment-123', {
        status: DeploymentStatus.FAILED,
        failureReason: 'Apollo sync failed',
        finishedAt: expect.any(Date),
      });
    });
  });

  describe('findById', () => {
    it('should return deployment with relations', async () => {
      const mockDeployment = {
        id: 'deployment-123',
        variant: { id: 'variant-456', name: 'production' },
        schemaVersion: { id: 'version-789', versionLabel: 'v1.0.0' },
      };

      mockDeploymentRepo.findOne.mockResolvedValue(mockDeployment);

      const result = await service.findById('deployment-123');

      expect(result).toEqual(mockDeployment);
      expect(mockDeploymentRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'deployment-123' },
        relations: ['variant', 'schemaVersion', 'schemaVersion.schema'],
      });
    });

    it('should return null if deployment not found', async () => {
      mockDeploymentRepo.findOne.mockResolvedValue(null);

      const result = await service.findById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('findByVariant', () => {
    it('should return deployments ordered by startedAt DESC', async () => {
      const mockDeployments = [
        { id: 'deployment-1', startedAt: new Date('2024-01-02') },
        { id: 'deployment-2', startedAt: new Date('2024-01-01') },
      ];

      mockDeploymentRepo.find.mockResolvedValue(mockDeployments);

      const result = await service.findByVariant('variant-456');

      expect(result).toEqual(mockDeployments);
      expect(mockDeploymentRepo.find).toHaveBeenCalledWith({
        where: { variantId: 'variant-456' },
        order: { startedAt: 'DESC' },
        relations: ['schemaVersion'],
      });
    });
  });
});
