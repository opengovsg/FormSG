// TODO (#42): remove these types when migrating away from middleware pattern

import { MyInfoAttribute } from './field/fieldTypes'
import { IPopulatedForm } from './form'
import { SpcpSession } from './spcp'

export type WithForm<T> = T & {
  form: IPopulatedForm
}

export type ResWithSpcpSession<T> = T & {
  locals: { spcpSession?: SpcpSession }
}

export type ResWithUinFin<T> = T & {
  uinFin?: string
}

export type ResWithHashedFields<T> = T & {
  locals: { hashedFields?: Set<MyInfoAttribute> }
}

export type SpcpLocals =
  | {
      uinFin: string
      hashedFields: Set<MyInfoAttribute>
    }
  | { uinFin: string; userInfo: string }
  | { [key: string]: never } // empty object
