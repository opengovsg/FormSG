import { BasicField, FormFieldDto, MyInfoChildAttributes } from './field'

export type FieldResponsesV3 = Record<FormFieldDto['_id'], FieldResponseV3>

export type FieldResponseV3 =
  | HeaderResponseV3
  | RadioResponseV3
  | CheckboxResponseV3
  | AttachmentResponseV3
  | DateResponseV3
  | TableResponseV3
  | ChildBirthRecordsResponseV3
  | YesNoResponseV3
  | EmailResponseV3
  | MobileResponseV3
  | StringAnswerFieldResponseV3

export type StringAnswerFieldResponseV3 =
  | NumberResponseV3
  | DecimalResponseV3
  | ShortTextResponseV3
  | LongTextResponseV3
  | HomeNoResponseV3
  | DropdownResponseV3
  | RatingResponseV3
  | NricResponseV3
  | UenResponseV3
  | DateResponseV3
  | CountryRegionResponseV3

export type HeaderResponseV3 = FieldResponseFactoryV3<BasicField.Section>
export type EmailResponseV3 = FieldResponseFactoryV3<BasicField.Email>
export type MobileResponseV3 = FieldResponseFactoryV3<BasicField.Mobile>
export type HomeNoResponseV3 = FieldResponseFactoryV3<BasicField.HomeNo>
export type NumberResponseV3 = FieldResponseFactoryV3<BasicField.Number>
export type DecimalResponseV3 = FieldResponseFactoryV3<BasicField.Decimal>
export type ShortTextResponseV3 = FieldResponseFactoryV3<BasicField.ShortText>
export type LongTextResponseV3 = FieldResponseFactoryV3<BasicField.LongText>
export type DropdownResponseV3 = FieldResponseFactoryV3<BasicField.Dropdown>
export type CountryRegionResponseV3 =
  FieldResponseFactoryV3<BasicField.CountryRegion>
export type YesNoResponseV3 = FieldResponseFactoryV3<BasicField.YesNo>
export type CheckboxResponseV3 = FieldResponseFactoryV3<BasicField.Checkbox>
export type RadioResponseV3 = FieldResponseFactoryV3<BasicField.Radio>
export type DateResponseV3 = FieldResponseFactoryV3<BasicField.Date>
export type RatingResponseV3 = FieldResponseFactoryV3<BasicField.Rating>
export type NricResponseV3 = FieldResponseFactoryV3<BasicField.Nric>
export type TableResponseV3 = FieldResponseFactoryV3<BasicField.Table>
export type UenResponseV3 = FieldResponseFactoryV3<BasicField.Uen>
export type ChildBirthRecordsResponseV3 =
  FieldResponseFactoryV3<BasicField.Children>
export type AttachmentResponseV3 = FieldResponseFactoryV3<BasicField.Attachment>

export type FieldResponseFactoryV3<F extends BasicField = BasicField> =
  FieldResponseV3Base & {
    fieldType: F
    answer: FieldResponseAnswerMapV3<F>
  }

export type FieldResponseV3Base = {
  fieldType: BasicField
}
export type FieldResponseAnswerMapV3<F extends BasicField = BasicField> =
  F extends SingleAnswerResponseFieldTypeV3
    ? SingleAnswerResponseV3
    : F extends BasicField.YesNo
      ? YesNoFieldResponseV3
      : F extends BasicField.Attachment
        ? AttachmentFieldResponseV3
        : F extends BasicField.Email | BasicField.Mobile
          ? VerifiableFieldResponsesV3
          : F extends BasicField.Table
            ? TableFieldResponsesV3
            : F extends BasicField.Radio
              ? RadioFieldResponsesV3
              : F extends BasicField.Checkbox
                ? CheckboxFieldResponsesV3
                : F extends BasicField.Children
                  ? ChildrenCompoundFieldResponsesV3
                  : never

export type SingleAnswerResponseFieldTypeV3 =
  | BasicField.Number
  | BasicField.Decimal
  | BasicField.ShortText
  | BasicField.LongText
  | BasicField.HomeNo
  | BasicField.Dropdown
  | BasicField.Rating
  | BasicField.Nric
  | BasicField.Uen
  | BasicField.Date
  | BasicField.CountryRegion

export type SingleAnswerResponseV3 = string
export type YesNoFieldResponseV3 = 'Yes' | 'No'
export type VerifiableFieldResponsesV3 = {
  signature?: string
  value: string
}
export type CheckboxFieldResponsesV3 = {
  value: string[]
  othersInput?: string
}
export type RadioFieldResponsesV3 = { value: string } | { othersInput: string }
export type TableRowFieldResponseV3 = {
  [columnId: string]: string
}
export type TableFieldResponsesV3 = TableRowFieldResponseV3[]

export type ChildrenCompoundFieldResponsesV3 = {
  // Each subarray represents one child value
  // e.g.
  // child : [['NAME', 'T12345678Z', 'VACCINATED'], ... ]
  // childFields: [name, bc number, vaxx status]
  child: string[][]
  // Array of attribute names
  childFields: MyInfoChildAttributes[]
}
export type AttachmentFieldResponseV3 = {
  hasBeenScanned: boolean
  answer: string
  md5Hash?: string
}
