import { FieldType } from './types'

// ============================================================
// V4 Response Types
// ============================================================

export type ResponseProvenance = {
  submittedAt: string
  stepNumber?: number
}

export type PreviousAnswer<A = unknown> = {
  answer: A
  provenance?: ResponseProvenance
}

// --------------- Answer types ---------------

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
export type TableRowV4 = { rowNum: number; [columnId: string]: string | number }
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

// --------------- Per-field response ---------------

export type FieldResponseV4 = {
  fieldType: FieldType
  answer: unknown
  provenance: ResponseProvenance
  previousAnswers?: PreviousAnswer[]
}

export type FieldResponsesV4 = Record<string, FieldResponseV4>

// --------------- Adapter options ---------------

export type AdaptV3ToV4Options = {
  /** Provenance to stamp on every converted response. */
  provenance?: ResponseProvenance
}
