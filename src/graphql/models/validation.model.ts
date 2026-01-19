import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType()
export class ValidationError {
  @Field()
  code: string;

  @Field()
  message: string;

  @Field({ nullable: true })
  path?: string;
}

@ObjectType()
export class SchemaValidationResult {
  @Field()
  isValid: boolean;

  @Field(() => [ValidationError])
  errors: ValidationError[];
}
