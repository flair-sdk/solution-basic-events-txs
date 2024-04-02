import { describe, expect, it, jest } from '@jest/globals'

import solutionDefinition, { Config } from '../src/index.ts'
import { EnricherEngine, FieldType, SolutionContext } from 'flair-sdk'

describe('solution', () => {
  it('should generate streaming sql file', async () => {
    const context: jest.Mocked<SolutionContext<Config>> = {
      solutionUsage: { source: 'test', config: {} },
      solutionDefinition,
      copyDir: jest.fn(),
      readStringFile: jest.fn(),
      writeStringFile: jest.fn(),
      readYamlFile: jest.fn<any>(),
      writeYamlFile: jest.fn(),
      glob: jest.fn(),
      runCommand: jest.fn(),
    }

    context.glob.mockReturnValueOnce(['schema.yaml'])
    context.readYamlFile.mockReturnValueOnce(
      Promise.resolve({
        Swap: {
          entityId: FieldType.STRING,
          amount: FieldType.BIGINT,
          amountUsd: FieldType.DOUBLE,
        },
      }),
    )

    if (!solutionDefinition?.prepareManifest) {
      throw new Error('prepareManifest is not defined in solution definition')
    }

    const updatedManifest = await solutionDefinition.prepareManifest(
      context,
      {
        schema: 'schema.yaml',
        databaseName: 'my_db',
        collectionsPrefix: 'indexer_',
        connectionUri: '{{ secret("mongodb.uri") }}',
      },
      {
        manifest: '1.0.0',
        namespace: 'my-test',
        cluster: { id: 'dev' },
      },
    )

    expect(context.writeStringFile).toHaveBeenNthCalledWith(
      1,
      'database/mongodb-default/streaming.sql',
      `SET 'execution.runtime-mode' = 'STREAMING';
---
--- Swap
---
CREATE TABLE source_Swap (
  \`entityId\` STRING,
  \`amount\` BIGINT,
  \`amountUsd\` DOUBLE,
  PRIMARY KEY (\`entityId\`) NOT ENFORCED
) WITH (
  'connector' = 'stream',
  'mode' = 'cdc',
  'namespace' = '{{ namespace }}',
  'entity-type' = 'Swap',
  'scan.startup.mode' = 'timestamp',
  'scan.startup.timestamp-millis' = '{{ chrono(\"2 hours ago\") * 1000 }}'
);

CREATE TABLE sink_Swap (
  \`entityId\` STRING,
  \`amount\` BIGINT,
  \`amountUsd\` DOUBLE,
  PRIMARY KEY (\`entityId\`) NOT ENFORCED
) WITH (
  'connector' = 'mongodb',
  'uri' = '{{ secret(\"mongodb.uri\") }}',
  'database' = 'my_db',
  'collection' = 'indexer_Swap'
);

INSERT INTO sink_Swap SELECT * FROM source_Swap WHERE entityId IS NOT NULL;
`,
    )

    expect(context.writeStringFile).toHaveBeenNthCalledWith(
      2,
      'database/mongodb-default/batch.sql',
      `SET 'execution.runtime-mode' = 'BATCH';
---
--- Swap
---
CREATE TABLE source_Swap (
  \`entityId\` STRING,
  \`amount\` BIGINT,
  \`amountUsd\` DOUBLE,
  PRIMARY KEY (\`entityId\`) NOT ENFORCED
) WITH (
  'connector' = 'database',
  'mode' = 'read',
  'namespace' = '{{ namespace }}',
  'entity-type' = 'Swap'
);

CREATE TABLE sink_Swap (
  \`entityId\` STRING,
  \`amount\` BIGINT,
  \`amountUsd\` DOUBLE,
  PRIMARY KEY (\`entityId\`) NOT ENFORCED
) WITH (
  'connector' = 'mongodb',
  'uri' = '{{ secret(\"mongodb.uri\") }}',
  'database' = 'my_db',
  'collection' = 'indexer_Swap'
);

INSERT INTO sink_Swap SELECT * FROM source_Swap WHERE entityId IS NOT NULL;
`,
    )

    expect(updatedManifest.enrichers?.length).toBe(2)
    expect(updatedManifest.enrichers?.[0]).toMatchObject({
      id: 'database-mongodb-default-streaming',
      engine: EnricherEngine.Flink,
      size: 'small',
      inputSql: 'database/mongodb-default/streaming.sql',
    })
    expect(updatedManifest.enrichers?.[1]).toMatchObject({
      id: 'database-mongodb-default-batch',
      engine: EnricherEngine.Flink,
      size: 'small',
      inputSql: 'database/mongodb-default/batch.sql',
    })
  })
})
