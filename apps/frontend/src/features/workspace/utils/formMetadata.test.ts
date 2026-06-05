import { FormOrigin } from 'formsg-shared/types'

import { mapWizardAnswersToFormMetadata } from './formMetadata'

describe('mapWizardAnswersToFormMetadata', () => {
  it('maps a "yes" paper-form answer to a paper form origin', () => {
    expect(mapWizardAnswersToFormMetadata({ isPaperForm: 'yes' })).toEqual({
      formOrigin: FormOrigin.Paper,
    })
  })

  it('maps a "no" paper-form answer to an unspecified origin', () => {
    expect(mapWizardAnswersToFormMetadata({ isPaperForm: 'no' })).toEqual({
      formOrigin: FormOrigin.Unspecified,
    })
  })
})
