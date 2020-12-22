// TODO (#42): remove these types when migrating away from middleware pattern
import { LeanDocument } from 'mongoose'

import { ProcessedFieldResponse } from '../app/modules/submission/submission.types'

import { IPopulatedForm } from './form'
import { SpcpSession } from './spcp'

export type WithForm<T> = T & {
  form: IPopulatedForm
}

export type WithJsonForm<T> = T & {
  form: LeanDocument<IPopulatedForm>
}

export type WithParsedResponses<T> = T & {
  parsedResponses: ProcessedFieldResponse[]
}

export type ResWithSpcpSession<T> = T & {
  locals: { spcpSession?: SpcpSession }
}

export type ResWithUinFin<T> = T & {
  uinFin?: string
}

export type ResWithHashedFields<T> = T & {
  locals: { hashedFields?: Set<string> }
}

export type SpcpLocals =
  | {
      uinFin: string
      hashedFields: Set<string>
    }
  | { uinFin: string; userInfo: string }
  | { [key: string]: never } // empty object
