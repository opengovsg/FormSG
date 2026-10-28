import { CorppassAttribute, FormAuthType } from 'formsg-shared/types'

import { LOGIN_IDENTITY_PREVIEW_VALUES } from '~features/myinfo/utils/augmentWithMyInfoDisplayValue'

export const PREVIEW_MOCK_UINFIN = 'S1234567A'

/**
 * The ID a preview shows as logged in. Corppass logs in a company, so it shows
 * the same sample UEN as the previewed UEN field.
 */
export const getPreviewMockLoginId = (authType: FormAuthType): string =>
  authType === FormAuthType.CP
    ? LOGIN_IDENTITY_PREVIEW_VALUES[CorppassAttribute.Uen]
    : PREVIEW_MOCK_UINFIN
