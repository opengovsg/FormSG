import { FormResponseMode } from '~shared/types'

export const RESPONSE_MODE_TO_TEXT: { [key in FormResponseMode]: string } = {
  [FormResponseMode.Multirespondent]: 'Multi-respondent form',
  [FormResponseMode.Email]: 'Email mode',
  [FormResponseMode.Encrypt]: 'Storage mode',
}
