import {
    ProcessorType,
    SolutionDefinition,
    SolutionScriptFunction,
} from 'flair-sdk'

const PACKAGE_NAME = '@flair-sdk/solution-basic-events-tx'

export type Config = {
    events?: {
        enabled?: boolean
    }
    transactions?: {
        enabled?: boolean
    }
}

const definition: SolutionDefinition<Config> = {
    prepareManifest: async (_context, config, manifest) => {

        if (config.events?.enabled) {
            manifest.processors = [
                ...(manifest.processors || []),
                {
                    id: 'basic-events',
                    type: ProcessorType.Event,
                    handler: `${PACKAGE_NAME}/src/processors/basic-events/handler.ts`,
                    abi: `${PACKAGE_NAME}/src/abis/*.json`,
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
                    abi: `${PACKAGE_NAME}/src/abis/*.json`,
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