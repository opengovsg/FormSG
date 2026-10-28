import { CorppassAttribute, FormAuthType } from 'formsg-shared/types'

import { LOGIN_IDENTITY_PREVIEW_VALUES } from '~features/myinfo/utils/augmentWithMyInfoDisplayValue'

export const PREVIEW_MOCK_UINFIN = 'S1234567A'

// Every login type is listed so a new one has to choose its sample ID.
const PREVIEW_MOCK_LOGIN_IDS: Record<FormAuthType, string> = {
  [FormAuthType.NIL]: PREVIEW_MOCK_UINFIN,
  [FormAuthType.SP]: PREVIEW_MOCK_UINFIN,
  [FormAuthType.MyInfo]: PREVIEW_MOCK_UINFIN,
  // Corppass logs in a company, so it shows the previewed UEN field's sample.
  [FormAuthType.CP]: LOGIN_IDENTITY_PREVIEW_VALUES[CorppassAttribute.Uen],
}

/** The ID a preview shows as logged in. */
export const getPreviewMockLoginId = (authType: FormAuthType): string =>
  PREVIEW_MOCK_LOGIN_IDS[authType]
