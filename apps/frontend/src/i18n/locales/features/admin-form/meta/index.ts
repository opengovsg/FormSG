import { FormResponseMode } from 'formsg-shared/types'

export * from './en-sg'

export interface Meta {
  prettyLastModified: string
  relativeDateFormat: {
    sameDay: string
    nextDay: string
    lastDay: string
    nextWeek: string
    lastWeek: string
    sameElse: string
  }
  responseModeText: {
    [k in FormResponseMode]: string
  }
  // TODO [MRF-CUTOVER]: Remove after cutover. Badge label for legacy (Encrypt)
  // forms while the cutover hides the response-mode distinction.
  legacyResponseModeText: string
}
