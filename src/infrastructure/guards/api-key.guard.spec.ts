import { Test, TestingModule } from '@nestjs/testing';
import { ApiKeyGuard } from './api-key.guard';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ApiKey } from '../database/entities/api-key.entity';

describe('ApiKeyGuard', () => {
  let guard: ApiKeyGuard;
  let apiKeyRepo: Repository<ApiKey>;

  const mockApiKeyRepo = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApiKeyGuard,
        {
          provide: getRepositoryToken(ApiKey),
          useValue: mockApiKeyRepo,
        },
      ],
    }).compile();

    guard = module.get<ApiKeyGuard>(ApiKeyGuard);
    apiKeyRepo = module.get<Repository<ApiKey>>(getRepositoryToken(ApiKey));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const createMockExecutionContext = (headers: Record<string, string>): ExecutionContext => {
    const mockContext = {
      getContext: () => ({
        req: { headers },
      }),
    };

    return {
      switchToHttp: jest.fn(),
      getArgByIndex: jest.fn(),
      getArgs: jest.fn(),
      getType: jest.fn(),
      getClass: jest.fn(),
      getHandler: jest.fn(),
    } as unknown as ExecutionContext;
  };

  it('should throw UnauthorizedException if API key is missing', async () => {
    const context = createMockExecutionContext({});
    jest.spyOn(GqlExecutionContext, 'create').mockReturnValue({
      getContext: () => ({ req: { headers: {} } }),
    } as any);

    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
    await expect(guard.canActivate(context)).rejects.toThrow('API Key is missing');
  });

  it('should throw UnauthorizedException if API key is invalid', async () => {
    const context = createMockExecutionContext({ 'x-api-key': 'invalid-key' });
    jest.spyOn(GqlExecutionContext, 'create').mockReturnValue({
      getContext: () => ({ req: { headers: { 'x-api-key': 'invalid-key' } } }),
    } as any);

    mockApiKeyRepo.findOne.mockResolvedValue(null);

    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
    await expect(guard.canActivate(context)).rejects.toThrow('Invalid or inactive API Key');
  });

  it('should throw UnauthorizedException if API key is inactive', async () => {
    const context = createMockExecutionContext({ 'x-api-key': 'valid-key' });
    jest.spyOn(GqlExecutionContext, 'create').mockReturnValue({
      getContext: () => ({ req: { headers: { 'x-api-key': 'valid-key' } } }),
    } as any);

    mockApiKeyRepo.findOne.mockResolvedValue(null); // Inactive keys won't be found with isActive: true filter

    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
    await expect(guard.canActivate(context)).rejects.toThrow('Invalid or inactive API Key');
  });

  it('should allow access with valid active API key', async () => {
    const mockReq = { headers: { 'x-api-key': 'valid-active-key' } };
    const context = createMockExecutionContext({ 'x-api-key': 'valid-active-key' });
    
    jest.spyOn(GqlExecutionContext, 'create').mockReturnValue({
      getContext: () => ({ req: mockReq }),
    } as any);

    mockApiKeyRepo.findOne.mockResolvedValue({
      key: 'valid-active-key',
      isActive: true,
      name: 'Test Key',
    });

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    expect(mockReq['apiKey']).toBeDefined();
    expect(mockReq['apiKey'].name).toBe('Test Key');
  });

  it('should handle uppercase X-API-KEY header', async () => {
    const mockReq = { headers: { 'X-API-KEY': 'valid-key' } };
    const context = createMockExecutionContext({ 'X-API-KEY': 'valid-key' });
    
    jest.spyOn(GqlExecutionContext, 'create').mockReturnValue({
      getContext: () => ({ req: mockReq }),
    } as any);

    mockApiKeyRepo.findOne.mockResolvedValue({
      key: 'valid-key',
      isActive: true,
    });

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
  });
});
