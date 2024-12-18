import {
    ProcessorType,
    SolutionDefinition,
    SolutionScriptFunction,
} from 'flair-sdk'

const PACKAGE_NAME = '@flair-sdk/solution-basic-events-txs'

export type Config = {
    events?: {
        enabled?: boolean
    }
    transactions?: {
        enabled?: boolean
    }
    abiDirectory?: string
}

const definition: SolutionDefinition<Config> = {
    prepareManifest: async (_context, config, manifest) => {

        const abiDirectory = config.abiDirectory || ``;

        if (config.events?.enabled) {
            manifest.processors = [
                ...(manifest.processors || []),
                {
                    id: 'basic-events',
                    type: ProcessorType.Event,
                    handler: `${PACKAGE_NAME}/src/processors/basic-events/handler.ts`,
                    abi: abiDirectory,
                },
            ]
        }

        if (config.transactions?.enabled) {
            manifest.processors = [
                ...(manifest.processors || []),
                {
                    id: 'basic-transactions',
                    type: ProcessorType.Transaction,
                    handler: `${PACKAGE_NAME}/src/processors/basic-transactions/handler.ts`,
                    abi: abiDirectory,
                },
            ]
        }

        manifest.processors = [
            ...(manifest.processors || []),
            {
                id: 'reorg',
                type: ProcessorType.Reorg,
                handler: `${PACKAGE_NAME}/src/processors/reorg/handler.ts`,
            },
        ]

        return manifest
    },
    registerScripts: (
        _context,
        _config,
    ): Record<string, SolutionScriptFunction> => {
        return {}
    },
}

export default definition