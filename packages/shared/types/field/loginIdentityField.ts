import { CorppassAttribute, MyInfoAttribute } from './base'
import { NricFieldBase } from './nricField'
import { ShortTextFieldBase } from './shortTextField'
import { UenFieldBase } from './uenField'

export type MyInfoNricField = NricFieldBase & {
  myInfo: { attr: MyInfoAttribute.UinFin }
}

export type CorppassUenField = UenFieldBase & {
  corppass: { attr: CorppassAttribute.Uen }
}

// A representative's UID can be a foreign identifier, so it uses short text.
export type CorppassUidField = ShortTextFieldBase & {
  corppass: { attr: CorppassAttribute.Uid }
}

export type LoginIdentityField =
  | MyInfoNricField
  | CorppassUenField
  | CorppassUidField
