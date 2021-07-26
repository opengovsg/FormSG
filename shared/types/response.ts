import { z } from 'zod'

// TODO(#2209): Replace when #2355 is merged in.
enum BasicField {
  Section = 'section',
  Statement = 'statement',
  Email = 'email',
  Mobile = 'mobile',
  HomeNo = 'homeno',
  Number = 'number',
  Decimal = 'decimal',
  Image = 'image',
  ShortText = 'textfield',
  LongText = 'textarea',
  Dropdown = 'dropdown',
  YesNo = 'yes_no',
  Checkbox = 'checkbox',
  Radio = 'radiobutton',
  Attachment = 'attachment',
  Date = 'date',
  Rating = 'rating',
  Nric = 'nric',
  Table = 'table',
  Uen = 'uen',
}
// TODO(#2209): Replace when #2355 is merged in.
enum MyInfoAttribute {
  Name = 'name',
  PassportNumber = 'passportnumber',
  RegisteredAddress = 'regadd',
  Employment = 'employment',
  VehicleNo = 'vehno',
  MarriageCertNo = 'marriagecertno',
  Sex = 'sex',
  Race = 'race',
  Dialect = 'dialect',
  Nationality = 'nationality',
  BirthCountry = 'birthcountry',
  ResidentialStatus = 'residentialstatus',
  HousingType = 'housingtype',
  HdbType = 'hdbtype',
  Marital = 'marital',
  CountryOfMarriage = 'countryofmarriage',
  WorkpassStatus = 'workpassstatus',
  Occupation = 'occupation',
  MobileNo = 'mobileno',
  DateOfBirth = 'dob',
  PassportExpiryDate = 'passportexpirydate',
  MarriageDate = 'marriagedate',
  DivorceDate = 'divorcedate',
  WorkpassExpiryDate = 'workpassexpirydate',
}

const ResponseBase = z.object({
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

const SingleAnswerResponse = ResponseBase.extend({
  answer: z.string(),
})

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

export const TableResponse = ResponseBase.extend({
  // Table fields have an array of array of strings.
  answerArray: z.array(z.array(z.string())),
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
  | YesNoResponse
  | CheckboxResponse
  | RadioResponse
  | AttachmentResponse
  | DateResponse
  | RatingResponse
  | NricResponse
  | TableResponse
  | UenResponse
