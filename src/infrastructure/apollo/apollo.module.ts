import { Module, Global } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ApolloService } from './apollo.service';

@Global()
@Module({
  imports: [HttpModule],
  providers: [ApolloService],
  exports: [ApolloService],
})
export class ApolloInfrastructureModule {}
