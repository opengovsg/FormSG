import { CLIENT_CHECKBOX_OTHERS_INPUT_VALUE } from 'formsg-shared/constants'
import { FormOrigin, FormResponseMode } from 'formsg-shared/types/form/form'

import { buildFormClientMetadata } from './buildFormClientMetadata'

describe('buildFormClientMetadata', () => {
  it('produces only the new-process value when formOriginProcess is "new", ignoring any medium state', () => {
    const metadata = buildFormClientMetadata({
      isPaperTrackingSetUpPageEnabled: true,
      isMrfCutoverEnabled: false,
      formOriginProcess: 'new',
      formOrigins: { value: [FormOrigin.Paper, FormOrigin.DigitalEmail] },
      formResponseMode: FormResponseMode.Multirespondent,
    })

    expect(metadata).toEqual({
      formOrigins: { value: [FormOrigin.DigitalNew] },
    })
  })

  it('produces exactly the selected medium when formOriginProcess is "existing" with one medium', () => {
    const metadata = buildFormClientMetadata({
      isPaperTrackingSetUpPageEnabled: true,
      isMrfCutoverEnabled: false,
      formOriginProcess: 'existing',
      formOrigins: { value: [FormOrigin.Paper] },
      formResponseMode: FormResponseMode.Multirespondent,
    })

    expect(metadata).toEqual({
      formOrigins: { value: [FormOrigin.Paper], othersInput: undefined },
    })
  })

  it('produces all selected mediums when multiple are ticked, including the new FormSG option', () => {
    const metadata = buildFormClientMetadata({
      isPaperTrackingSetUpPageEnabled: true,
      isMrfCutoverEnabled: false,
      formOriginProcess: 'existing',
      formOrigins: {
        value: [FormOrigin.Paper, FormOrigin.DigitalFormsg],
      },
      formResponseMode: FormResponseMode.Multirespondent,
    })

    expect(metadata).toEqual({
      formOrigins: {
        value: [FormOrigin.Paper, FormOrigin.DigitalFormsg],
        othersInput: undefined,
      },
    })
  })

  it('includes the trimmed "other" detail when other is selected with text', () => {
    const metadata = buildFormClientMetadata({
      isPaperTrackingSetUpPageEnabled: true,
      isMrfCutoverEnabled: false,
      formOriginProcess: 'existing',
      formOrigins: {
        value: [CLIENT_CHECKBOX_OTHERS_INPUT_VALUE],
        othersInput: '  Carrier pigeon  ',
      },
      formResponseMode: FormResponseMode.Multirespondent,
    })

    expect(metadata).toEqual({
      formOrigins: {
        value: [CLIENT_CHECKBOX_OTHERS_INPUT_VALUE],
        othersInput: 'Carrier pigeon',
      },
    })
  })

  it('omits the "other" detail when other is selected with a blank/whitespace-only detail', () => {
    const metadata = buildFormClientMetadata({
      isPaperTrackingSetUpPageEnabled: true,
      isMrfCutoverEnabled: false,
      formOriginProcess: 'existing',
      formOrigins: {
        value: [CLIENT_CHECKBOX_OTHERS_INPUT_VALUE],
        othersInput: '   ',
      },
      formResponseMode: FormResponseMode.Multirespondent,
    })

    expect(metadata).toEqual({
      formOrigins: {
        value: [CLIENT_CHECKBOX_OTHERS_INPUT_VALUE],
        othersInput: undefined,
      },
    })
  })

  it('produces no formOrigins payload during the MRF-cutover escape hatch, regardless of Q1/Q2 state', () => {
    const metadataForNewProcess = buildFormClientMetadata({
      isPaperTrackingSetUpPageEnabled: true,
      isMrfCutoverEnabled: true,
      formOriginProcess: 'new',
      formOrigins: undefined,
      formResponseMode: FormResponseMode.Encrypt,
    })
    const metadataForExistingProcess = buildFormClientMetadata({
      isPaperTrackingSetUpPageEnabled: true,
      isMrfCutoverEnabled: true,
      formOriginProcess: 'existing',
      formOrigins: { value: [FormOrigin.Paper] },
      formResponseMode: FormResponseMode.Encrypt,
    })

    expect(metadataForNewProcess).toBeUndefined()
    expect(metadataForExistingProcess).toBeUndefined()
  })

  it('produces no formOrigins payload when formOriginProcess is unanswered', () => {
    const metadata = buildFormClientMetadata({
      isPaperTrackingSetUpPageEnabled: true,
      isMrfCutoverEnabled: false,
      formOriginProcess: undefined,
      formOrigins: undefined,
      formResponseMode: FormResponseMode.Multirespondent,
    })

    expect(metadata).toBeUndefined()
  })
})
