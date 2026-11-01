import { FormAuthType } from 'formsg-shared/types'

import { getPreviewMockLoginId, PREVIEW_MOCK_UINFIN } from './constants'

describe('getPreviewMockLoginId', () => {
  it('shows a sample UEN for Corppass, matching the previewed UEN field', () => {
    expect(getPreviewMockLoginId(FormAuthType.CP)).toBe('201912345A')
  })

  it.each([FormAuthType.MyInfo, FormAuthType.SP])(
    'shows the sample NRIC for %s',
    (authType) => {
      expect(getPreviewMockLoginId(authType)).toBe(PREVIEW_MOCK_UINFIN)
    },
  )
})
