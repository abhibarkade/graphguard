import { registerEnumType } from '@nestjs/graphql';

export enum SchemaVersionStatus {
  DRAFT = 'DRAFT',
  VALIDATED = 'VALIDATED',
  ACTIVE = 'ACTIVE',
  DEPRECATED = 'DEPRECATED',
  ROLLED_BACK = 'ROLLED_BACK',
}

registerEnumType(SchemaVersionStatus, {
  name: 'SchemaVersionStatus',
});
