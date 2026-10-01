import { DecryptParamsV3, EncryptedContent, FieldType } from './types'

/**
 * Version 1 of a FormSG-signed login verification record.
 *
 * Phase 2 must sign the version, provider, attribute, stable workflow step ID,
 * form ID, submission ID, field ID and exact answer value using a distinct
 * signing format. The form/submission/field IDs and answer come from the
 * containing response context rather than being duplicated in this record.
 *
 * Presence alone is not proof. Consumers must verify the signature and its
 * context bindings. Signing and verification are not implemented by this type.
 */
export type LoginVerificationV1 = {
  version: 1
  workflowStepId: string
  /** Base64-encoded FormSG signature. */
  signature: string
} & (
  | {
      provider: 'MyInfo'
      // Matches existing MyInfo attribute metadata; the server validates support.
      attribute: MyInfoMetaV4['attr']
    }
  | {
      provider: 'CP'
      attribute: 'uen' | 'uid'
    }
)

export type LoginVerification = LoginVerificationV1

export type ResponseProvenance = {
  submittedAt?: string
  stepNumber?: number
  /**
   * Server-stamped after the submitted answer was verified against the MyInfo
   * hashes saved at prefill time. Never client-supplied; absent when no
   * verification happened (e.g. user-filled child records).
   */
  myinfoVerified?: boolean
  /**
   * Optional signed login proof, created by the server in Phase 2. Never
   * client-supplied or inferred for historical or manually entered answers.
   */
  loginVerification?: LoginVerification
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
  value: [number, number, number][][]
  type: 'draw'
}

export type MyInfoMetaV4 = { attr: string }

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
  question: string
  provenance: ResponseProvenance
  previousAnswers?: PreviousAnswer[]
  myInfo?: MyInfoMetaV4
}

export type FieldResponsesV4 = Record<string, FieldResponseV4>

type BaseFieldResponseV4 = {
  provenance: ResponseProvenance
  previousAnswers?: PreviousAnswer[]
  myInfo?: MyInfoMetaV4
  question: string
}

export type StringFieldResponseV4 = BaseFieldResponseV4 & {
  fieldType:
    | 'section'
    | 'number'
    | 'decimal'
    | 'textfield'
    | 'textarea'
    | 'homeno'
    | 'dropdown'
    | 'rating'
    | 'nric'
    | 'uen'
    | 'date'
    | 'country_region'
  answer: StringAnswerV4
}

export type YesNoFieldResponseV4 = BaseFieldResponseV4 & {
  fieldType: 'yes_no'
  answer: YesNoAnswerV4
}

export type VerifiableFieldResponseV4 = BaseFieldResponseV4 & {
  fieldType: 'email' | 'mobile'
  answer: VerifiableAnswerV4
}

export type RadioFieldResponseV4 = BaseFieldResponseV4 & {
  fieldType: 'radiobutton'
  answer: RadioAnswerV4
}

export type CheckboxFieldResponseV4 = BaseFieldResponseV4 & {
  fieldType: 'checkbox'
  answer: CheckboxAnswerV4
}

export type AttachmentFieldResponseV4 = BaseFieldResponseV4 & {
  fieldType: 'attachment'
  answer: AttachmentAnswerV4
}

export type TableFieldResponseV4 = BaseFieldResponseV4 & {
  fieldType: 'table'
  answer: TableAnswerV4
}

export type ChildrenFieldResponseV4 = BaseFieldResponseV4 & {
  fieldType: 'children'
  answer: ChildrenAnswerV4
}

export type AddressFieldResponseV4 = BaseFieldResponseV4 & {
  fieldType: 'address'
  answer: AddressAnswerV4
}

export type SignatureFieldResponseV4 = BaseFieldResponseV4 & {
  fieldType: 'signature'
  answer: SignatureAnswerV4
}

export type FormFieldV4 =
  | StringFieldResponseV4
  | YesNoFieldResponseV4
  | VerifiableFieldResponseV4
  | RadioFieldResponseV4
  | CheckboxFieldResponseV4
  | AttachmentFieldResponseV4
  | TableFieldResponseV4
  | ChildrenFieldResponseV4
  | AddressFieldResponseV4
  | SignatureFieldResponseV4

export type FormFieldsV4 = Record<string, FormFieldV4>

export type FormFieldMeta = {
  question: string
  myInfo?: { attr: string }
}

export type AdaptV3ToV4Options = {
  /** Provenance to stamp on every converted response. */
  provenance?: ResponseProvenance
  /** Form field definitions keyed by field ID, used to populate question text and myInfo. */
  formFields?: Record<string, FormFieldMeta>
}

// --------------- Decrypted content V4 ---------------

export interface DecryptParamsV4 extends DecryptParamsV3 {
  encryptedStepToken?: EncryptedContent
}

export type DecryptedContentV4 = {
  submissionSecretKey: string
  stepToken?: string
  responses: FieldResponsesV4
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  verified?: Record<string, any>
}
