import { FormResponseMode } from '~shared/types'

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
}
