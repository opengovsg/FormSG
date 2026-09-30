import { describe, expect, it } from 'vitest'

import { getPendingResponseAtString } from '../common/utils/mrfSubmissionView'

import { metadataFor } from './adapters'
import { createPrototypeResponses } from './model'

describe('prototype response metadata', () => {
  it('shows the same pending step as the local model, including Step 1', () => {
    const response = createPrototypeResponses()[0]
    for (const step of response.steps) {
      const metadata = metadataFor([{ ...response, currentStepId: step.id }])
        .metadata[0].mrf!
      expect(
        getPendingResponseAtString({
          ...metadata,
          workflowStatus: metadata.workflowStatus!,
        }),
      ).toBe(`Step ${step.number} of ${response.steps.length}`)
    }
  })
})
