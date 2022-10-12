import type { Opaque } from 'type-fest'
import { z } from 'zod'
import { BasicField, MyInfoAttribute } from './field'

const ResponseBase = z.object({
  myInfo: z.never().optional(),
  signature: z.never().optional(),
  _id: z.string(),
  question: z.string(),
})
const MyInfoResponseBase = z.object({
  myInfo: z
    .object({
      attr: z.nativeEnum(MyInfoAttribute),
    })
    .optional(),
})

const VerifiableResponseBase = z.object({
  signature: z.string().optional(),
})
export type VerifiableResponseBase = z.infer<typeof VerifiableResponseBase>

const SingleAnswerResponse = ResponseBase.extend({
  answer: z.string(),
})
export type SingleAnswerResponse = z.infer<typeof SingleAnswerResponse>

const MultiAnswerResponse = ResponseBase.extend({
  answerArray: z.array(z.string()),
})

const MyInfoableSingleResponse = SingleAnswerResponse.merge(MyInfoResponseBase)

export const HeaderResponse = SingleAnswerResponse.extend({
  isHeader: z.literal(true),
  fieldType: z.literal(BasicField.Section),
})
export type HeaderResponse = z.infer<typeof HeaderResponse>

export const EmailResponse = SingleAnswerResponse.merge(
  VerifiableResponseBase,
).extend({ fieldType: z.literal(BasicField.Email) })
export type EmailResponse = z.infer<typeof EmailResponse>

export const MobileResponse = MyInfoableSingleResponse.merge(
  VerifiableResponseBase,
).extend({ fieldType: z.literal(BasicField.Mobile) })
export type MobileResponse = z.infer<typeof MobileResponse>

export const HomeNoResponse = MyInfoableSingleResponse.extend({
  fieldType: z.literal(BasicField.HomeNo),
})
export type HomeNoResponse = z.infer<typeof HomeNoResponse>

export const NumberResponse = MyInfoableSingleResponse.extend({
  fieldType: z.literal(BasicField.Number),
})
export type NumberResponse = z.infer<typeof NumberResponse>

export const DecimalResponse = SingleAnswerResponse.extend({
  fieldType: z.literal(BasicField.Decimal),
})
export type DecimalResponse = z.infer<typeof DecimalResponse>

export const ShortTextResponse = MyInfoableSingleResponse.extend({
  fieldType: z.literal(BasicField.ShortText),
})
export type ShortTextResponse = z.infer<typeof ShortTextResponse>

export const LongTextResponse = SingleAnswerResponse.extend({
  fieldType: z.literal(BasicField.LongText),
})
export type LongTextResponse = z.infer<typeof LongTextResponse>

export const DropdownResponse = MyInfoableSingleResponse.extend({
  fieldType: z.literal(BasicField.Dropdown),
})
export type DropdownResponse = z.infer<typeof DropdownResponse>

export const CountryRegionResponse = MyInfoableSingleResponse.extend({
  fieldType: z.literal(BasicField.CountryRegion),
})
export type CountryRegionResponse = z.infer<typeof CountryRegionResponse>

export const YesNoResponse = SingleAnswerResponse.extend({
  fieldType: z.literal(BasicField.YesNo),
})
export type YesNoResponse = z.infer<typeof YesNoResponse>

export const CheckboxResponse = MultiAnswerResponse.extend({
  fieldType: z.literal(BasicField.Checkbox),
})
export type CheckboxResponse = z.infer<typeof CheckboxResponse>

export const RadioResponse = SingleAnswerResponse.extend({
  fieldType: z.literal(BasicField.Radio),
})
export type RadioResponse = z.infer<typeof RadioResponse>

export const AttachmentResponse = SingleAnswerResponse.extend({
  fieldType: z.literal(BasicField.Attachment),
})
export type AttachmentResponse = z.infer<typeof AttachmentResponse>

export const DateResponse = MyInfoableSingleResponse.extend({
  fieldType: z.literal(BasicField.Date),
})
export type DateResponse = z.infer<typeof DateResponse>

export const RatingResponse = SingleAnswerResponse.extend({
  fieldType: z.literal(BasicField.Rating),
})
export type RatingResponse = z.infer<typeof RatingResponse>

export const NricResponse = SingleAnswerResponse.extend({
  fieldType: z.literal(BasicField.Nric),
})
export type NricResponse = z.infer<typeof NricResponse>

export type TableRow = Opaque<string[], 'TableRow'>

export const TableResponse = ResponseBase.extend({
  // Table fields have an array of array of strings.
  answerArray: z.array(z.array(z.string())) as unknown as z.Schema<TableRow[]>,
  fieldType: z.literal(BasicField.Table),
})
export type TableResponse = z.infer<typeof TableResponse>

export const UenResponse = SingleAnswerResponse.extend({
  fieldType: z.literal(BasicField.Uen),
})
export type UenResponse = z.infer<typeof UenResponse>

export type FieldResponse =
  | HeaderResponse
  | EmailResponse
  | MobileResponse
  | HomeNoResponse
  | NumberResponse
  | DecimalResponse
  | ShortTextResponse
  | LongTextResponse
  | DropdownResponse
  | CountryRegionResponse
  | YesNoResponse
  | CheckboxResponse
  | RadioResponse
  | AttachmentResponse
  | DateResponse
  | RatingResponse
  | NricResponse
  | TableResponse
  | UenResponse
