import { FormOrigin, FormResponseMode } from 'formsg-shared/types/form/form'

import { buildFormClientMetadata } from './buildFormClientMetadata'

describe('buildFormClientMetadata', () => {
  it.each([
    FormOrigin.DigitalNew,
    FormOrigin.DigitalExisting,
    FormOrigin.Paper,
  ])(
    'saves the chosen origin "%s" as the only formOrigins value',
    (formOrigin) => {
      const metadata = buildFormClientMetadata({
        isPaperTrackingSetUpPageEnabled: true,
        isMrfCutoverEnabled: false,
        formOrigin,
        formResponseMode: FormResponseMode.Multirespondent,
      })

      expect(metadata).toEqual({ formOrigins: { value: [formOrigin] } })
    },
  )

  it('produces no formOrigins payload when the question is unanswered', () => {
    const metadata = buildFormClientMetadata({
      isPaperTrackingSetUpPageEnabled: true,
      isMrfCutoverEnabled: false,
      formOrigin: undefined,
      formResponseMode: FormResponseMode.Multirespondent,
    })

    expect(metadata).toBeUndefined()
  })

  it('produces no formOrigins payload when paper tracking is off', () => {
    const metadata = buildFormClientMetadata({
      isPaperTrackingSetUpPageEnabled: false,
      isMrfCutoverEnabled: false,
      formOrigin: FormOrigin.Paper,
      formResponseMode: FormResponseMode.Multirespondent,
    })

    expect(metadata).toBeUndefined()
  })

  it('produces no formOrigins payload during the MRF-cutover escape hatch', () => {
    const metadata = buildFormClientMetadata({
      isPaperTrackingSetUpPageEnabled: true,
      isMrfCutoverEnabled: true,
      formOrigin: FormOrigin.Paper,
      formResponseMode: FormResponseMode.Encrypt,
    })

    expect(metadata).toBeUndefined()
  })
})
