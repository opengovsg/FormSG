import { SignatureVectorArray } from '../types/field'

/**
 * The V4 answer shapes, as they arrive on the MRF wire.
 *
 * These are re-declared here rather than imported from `@opengovsg/formsg-sdk`
 * on purpose: `formsg-shared` must not depend on the SDK (nor on the frontend),
 * and the flatten only ever reads a handful of plain fields off each answer.
 * `response-value-rules.ts` sets the same precedent with its `*AnswerInput`
 * types. The SDK remains the authority on the wire format; if it changes, this
 * file follows.
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

/**
 * One V4 wire response. `fieldType` is typed as a bare string because the SDK
 * types it as its own `FieldType` string union rather than `BasicField`, and a
 * caller holding the SDK's type must be able to pass it straight through.
 *
 * `question` is optional because the MRF middleware strips it on the way in
 * (`question: Joi.any().strip()`); only the SDK's frontend decrypt path
 * re-injects one.
 */
export type FieldResponseV4Input = {
  fieldType: string
  answer: AnswerV4
  question?: string
}

export type FieldResponsesV4Input = Record<string, FieldResponseV4Input>
