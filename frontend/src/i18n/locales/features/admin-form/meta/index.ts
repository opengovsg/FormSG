import { FormResponseMode } from '~shared/types'

export * from './en-sg'

export interface Meta {
  prettyLastModified: string
  responseModeText: {
    [k in FormResponseMode]: string
  }
}
