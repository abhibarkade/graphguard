import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApiKey } from '../database/entities/api-key.entity';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(
    @InjectRepository(ApiKey)
    private apiKeyRepo: Repository<ApiKey>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const ctx = GqlExecutionContext.create(context);
    const { req } = ctx.getContext();
    const key = req.headers['x-api-key'] || req.headers['X-API-KEY'];

    if (!key) {
      throw new UnauthorizedException('API Key is missing');
    }

    const apiKey = await this.apiKeyRepo.findOne({ where: { key, isActive: true } });
    if (!apiKey) {
      throw new UnauthorizedException('Invalid or inactive API Key');
    }

    // Attach api key info to request if needed
    req.apiKey = apiKey;
    return true;
  }
}
