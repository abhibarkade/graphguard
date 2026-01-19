import { registerEnumType } from '@nestjs/graphql';

export enum DeploymentStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  SUCCEEDED = 'SUCCEEDED',
  FAILED = 'FAILED',
  ROLLED_BACK = 'ROLLED_BACK',
}

registerEnumType(DeploymentStatus, {
  name: 'DeploymentStatus',
});
