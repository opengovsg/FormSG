import { FormResponseMode } from '~shared/types'

export const enSG = {
  prettyLastModified: 'Edited {prettyLastModified}',
  responseModeText: {
    [FormResponseMode.Multirespondent]: 'Multi-respondent form',
    [FormResponseMode.Email]: 'Email mode',
    [FormResponseMode.Encrypt]: 'Storage mode',
  },
}
