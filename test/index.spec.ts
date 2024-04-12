import { describe, expect, it } from '@jest/globals'

import solutionDefinition, { Config } from '../src/index.ts'

describe('solution', () => {
  it('should define prepareManifest', async () => {
    expect(solutionDefinition.prepareManifest).toBeDefined()
  })
})