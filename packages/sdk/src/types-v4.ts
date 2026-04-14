import { FieldType } from './types'

// TODO: provenance shape may be updated when it is implemented
export type ResponseProvenance = {
  submittedAt: string
  stepNumber?: number
}

export type PreviousAnswer = {
  answer: AnswerV4
  provenance?: ResponseProvenance
}

/** Answer Types */

export type StringAnswerV4 = { value: string }
export type YesNoAnswerV4 = { value: 'Yes' | 'No' }
export type VerifiableAnswerV4 = { value: string; signature?: string }
export type RadioAnswerV4 = { value: string; isOthersInput: boolean }
export type CheckboxAnswerV4 = { value: string[]; othersInput?: string }
export type AttachmentAnswerV4 = {
  value: string
  hasBeenScanned: boolean
  md5Hash?: string
}
export type TableRowV4 = {
  rowNum: number
  value: { [columnId: string]: string | number }
}
export type TableAnswerV4 = { [rowId: string]: TableRowV4 }
export type ChildSubFieldAnswerV4 = {
  value: string
  myInfo?: { attr: string }
}
export type ChildEntryV4 = {
  [attr: string]: ChildSubFieldAnswerV4 | string | undefined
  type?: string
}
export type ChildrenAnswerV4 = { [childKey: string]: ChildEntryV4 }
export type AddressAnswerV4 = {
  postalCode: StringAnswerV4
  blockNumber: StringAnswerV4
  streetName: StringAnswerV4
  buildingName: StringAnswerV4
  levelNumber: StringAnswerV4
  unitNumber: StringAnswerV4
}
export type SignatureAnswerV4 = {
  value: [number, number, number][][]
  type: 'draw'
}

export type AnswerV4 =
  | StringAnswerV4
  | YesNoAnswerV4
  | VerifiableAnswerV4
  | RadioAnswerV4
  | CheckboxAnswerV4
  | AttachmentAnswerV4
  | TableAnswerV4
  | ChildrenAnswerV4
  | AddressAnswerV4
  | SignatureAnswerV4

export type FieldResponseV4 = {
  fieldType: FieldType
  answer: AnswerV4
  provenance: ResponseProvenance
  previousAnswers?: PreviousAnswer[]
}

export type FieldResponsesV4 = Record<string, FieldResponseV4>

export type AdaptV3ToV4Options = {
  /** Provenance to stamp on every converted response. */
  provenance?: ResponseProvenance
}
