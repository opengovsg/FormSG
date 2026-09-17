import { SignatureVectorArray } from '../types/field'

/**
 * The V4 answer shapes, as they arrive on the MRF V4 format.
 *
 * NOTE: Some of these are re-declared here, since the
 * shared package should not depend on the SDK.
 */
export type StringAnswerV4 = { value: string }
export type VerifiableAnswerV4 = { value: string; signature?: string }
export type RadioAnswerV4 = { value: string; isOthersInput: boolean }
export type CheckboxAnswerV4 = { value: string[]; othersInput?: string }
export type AttachmentAnswerV4 = {
  value: string
  hasBeenScanned?: boolean
  md5Hash?: string
}
export type TableRowV4 = {
  rowNum: number
  value: { [columnId: string]: string | number }
}
export type TableAnswerV4 = { [rowId: string]: TableRowV4 }
export type ChildSubFieldAnswerV4 = { value: string; myInfo?: { attr: string } }
export type ChildEntryV4 = {
  value: { [attr: string]: ChildSubFieldAnswerV4 }
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
  value: SignatureVectorArray
  type: string
}

export type AnswerV4 =
  | StringAnswerV4
  | VerifiableAnswerV4
  | RadioAnswerV4
  | CheckboxAnswerV4
  | AttachmentAnswerV4
  | TableAnswerV4
  | ChildrenAnswerV4
  | AddressAnswerV4
  | SignatureAnswerV4

export type FieldResponseV4Input = {
  // RATIONALE: `string`, not `BasicField` or the SDK's `FieldType` union, so
  // an SDK `FieldResponseV4` can be passed through without a cast. Shared
  // cannot import the SDK type.
  fieldType: string
  answer: AnswerV4
  // RATIONALE: optional even though the SDK type requires it. Joi removes
  // `question` from the request body (`question: Joi.any().strip()`).
  // Decrypt puts it back.
  question?: string
}

export type FieldResponsesV4Input = Record<string, FieldResponseV4Input>
