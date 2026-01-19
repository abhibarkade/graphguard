import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class ApolloService {
  private readonly logger = new Logger(ApolloService.name);
  private readonly platformUrl = 'https://graphql.api.apollographql.com/api/graphql';

  constructor(
    private configService: ConfigService,
    private httpService: HttpService,
  ) {}

  private get headers() {
    return {
      'x-api-key': this.configService.get<string>('apollo.key'),
      'Content-Type': 'application/json',
      'apollographql-client-name': 'graphguard',
      'apollographql-client-version': '1.0.0',
    };
  }

  async checkSchema(variant: string, subgraph: string, sdl: string) {
    const graphId = this.configService.get<string>('apollo.graphId');
    const query = `
      mutation SubgraphCheckMutation(
        $input: SubgraphCheckAsyncInput!,
        $name: String!,
        $graph_id: ID!
      ) {
        graph(id: $graph_id) {
          variant(name: $name) {
            submitSubgraphCheckAsync(input: $input) {
              __typename
              ... on CheckRequestSuccess {
                targetURL
                workflowID
              }
              ... on InvalidInputError {
                message
              }
            }
          }
        }
      }
    `;

    const variables = {
      graph_id: graphId,
      name: variant,
      input: {
        graphRef: `${graphId}@${variant}`,
        subgraphName: subgraph,
        proposedSchema: sdl,
        gitContext: {
          branch: 'main',
          commit: '0000000000000000000000000000000000000000',
          committer: 'graphguard',
          remoteUrl: 'https://github.com/abhibarkade/graphguard.git',
        },
        config: {
          from: null,
          to: null,
          excludedClients: null,
          excludedOperationNames: null,
          ignoredOperations: null,
          includedVariants: null,
          queryCountThreshold: null,
          queryCountThresholdPercentage: null,
        },
        introspectionEndpoint: null,
        isProposal: false,
        isSandbox: false,
      },
    };

    try {
      const response = await firstValueFrom(
        this.httpService.post(
          this.platformUrl,
          { query, variables, operationName: 'SubgraphCheckMutation' },
          { headers: this.headers },
        ),
      );

      this.logger.debug(`Apollo Check Response: ${JSON.stringify(response.data)}`);

      const result = response.data.data?.graph?.variant?.submitSubgraphCheckAsync;
      const isValid = result?.__typename === 'CheckRequestSuccess';

      return {
        isValid: isValid,
        errors: !isValid ? [{ message: result?.message || 'Check failed' }] : [],
        workflowId: result?.workflowID,
      };
    } catch (error) {
      this.logger.error('Failed to check schema with Apollo Platform', error.stack);
      throw error;
    }
  }

  async publishSchema(variant: string, subgraph: string, sdl: string, revision: string) {
    const graphId = this.configService.get<string>('apollo.graphId');
    const query = `
      mutation SubgraphPublishMutation(
        $graph_id: ID!
        $variant: String!
        $subgraph: String!
        $url: String
        $revision: String!
        $schema: PartialSchemaInput!
        $git_context: GitContextInput!
      ) {
        graph(id: $graph_id) {
          publishSubgraph(
            name: $subgraph
            url: $url
            revision: $revision
            activePartialSchema: $schema
            graphVariant: $variant
            gitContext: $git_context
          ) {
            errors {
              message
              code
            }
            launchUrl
          }
        }
      }
    `;

    const variables = {
      graph_id: graphId,
      variant: variant,
      subgraph: subgraph,
      url: null,
      revision: revision,
      schema: { sdl },
      git_context: {
        branch: 'main',
        commit: revision,
        committer: 'graphguard',
      },
    };

    try {
      const response = await firstValueFrom(
        this.httpService.post(
          this.platformUrl,
          { query, variables, operationName: 'SubgraphPublishMutation' },
          { headers: this.headers },
        ),
      );

      this.logger.debug(`Apollo Publish Response: ${JSON.stringify(response.data)}`);

      const result = response.data.data?.graph?.publishSubgraph;
      return {
        success: !result?.errors?.length,
        compositionErrors: result?.errors || [],
        launchUrl: result?.launchUrl,
      };
    } catch (error) {
      this.logger.error('Failed to publish schema to Apollo Platform', error.stack);
      throw error;
    }
  }
}
