import { DateSelectedValidation } from "../../constants"

export enum BasicField {
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
}

export enum MyInfoAttribute {
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

export enum SPCPFieldTitle {
  SpNric = 'SingPass Validated NRIC',
  CpUid = 'CorpPass Validated UID',
  CpUen = 'CorpPass Validated UEN',
}

export interface IMyInfo {
  attr: MyInfoAttribute
}

export interface IField {
  globalId?: string
  title: string
  description: string
  required: boolean
  disabled: boolean
  fieldType: BasicField
  myInfo?: IMyInfo
}

export enum AttachmentSize {
  OneMb = '1',
  TwoMb = '2',
  ThreeMb = '3',
  SevenMb = '7',
  TenMb = '10',
  TwentyMb = '20',
}

export interface IAttachmentField extends IField {
  attachmentSize: AttachmentSize
}

export type CheckboxValidationOptions = {
  customMax: number | null
  customMin: number | null
}

export interface ICheckboxField extends IField {
  fieldOptions: string[]
  othersRadioButton: boolean
  ValidationOptions: CheckboxValidationOptions
  validateByValue: boolean
}

export type DateValidationOptions = {
  customMaxDate: Date | null
  customMinDate: Date | null
  selectedDateValidation: DateSelectedValidation | null
}

export interface IDateField extends IField {
  dateValidation: DateValidationOptions
}

export type DecimalValidationOptions = {
  customMax: number | null
  customMin: number | null
}

export interface IDecimalField extends IField {
  ValidationOptions: DecimalValidationOptions
  validateByValue: boolean
}

export interface IDropdownField extends IField {
  fieldOptions: string[]
}

export type AutoReplyOptions = {
  hasAutoReply: boolean
  autoReplySubject: string
  autoReplySender: string
  autoReplyMessage: string
  includeFormSummary: boolean
}

export interface IEmailField extends IField {
  autoReplyOptions: AutoReplyOptions
  isVerifiable: boolean
  hasAllowedEmailDomains: boolean
  allowedEmailDomains: string[]
}

export interface IHomenoField extends IField {
  allowIntlNumbers: boolean
}

export interface IImageField extends IField {
  url: string
  fileMd5Hash: string
  name: string
  size: string
}

export enum TextSelectedValidation {
  Maximum = 'Maximum',
  Minimum = 'Minimum',
  Exact = 'Exact',
  Range = 'Range', // TODO(#408) - questionable value
}


export type LongTextValidationOptions = {
  customMax: number | null
  customMin: number | null
  customVal: number | null
  selectedValidation: TextSelectedValidation | null
}

export interface ILongTextField extends IField {
  ValidationOptions: LongTextValidationOptions
}

export type ShortTextValidationOptions = {
  customMax: number | null
  customMin: number | null
  customVal: number | null
  selectedValidation: TextSelectedValidation | null
}

export interface IShortTextField extends IField {
  ValidationOptions: ShortTextValidationOptions
}

export interface IMobileField extends IField {
  allowIntlNumbers: boolean
  isVerifiable: boolean
}

export type INricField = IField
export type ISectionField = IField
export type IStatementField = IField
export type IYesNoField = IField

export enum NumberSelectedValidation {
  Max = 'Maximum',
  Min = 'Minimum',
  Exact = 'Exact',
  Range = 'Range',
}

export type NumberValidationOptions = {
  customMax: number | null
  customMin: number | null
  customVal: number | null
  selectedValidation: NumberSelectedValidation | null
}

export interface INumberField extends IField {
  ValidationOptions: NumberValidationOptions
}

export interface IRadioField extends IField {
  fieldOptions: string[]
  othersRadioButton: boolean
}

export enum RatingShape {
  Heart = 'Heart',
  Star = 'Star',
}

export interface IRatingField extends IField {
  ratingOptions: {
    steps: number
    shape: RatingShape
  }
}

export interface IColumn {
  title: string
  required: boolean
  // Pre-validate hook will block non-dropdown/
  // non-textfield types.
  columnType: BasicField.ShortText | BasicField.Dropdown
}

export interface ITableField extends IField {
  minimumRows: number
  addMoreRows?: boolean
  maximumRows?: number
  columns: IColumn[]
}

export type FormField =
  | IAttachmentField
  | ICheckboxField
  | IDateField
  | IDecimalField
  | IDropdownField
  | IEmailField
  | IHomenoField
  | IImageField
  | ILongTextField
  | IMobileField
  | INricField
  | INumberField
  | IRadioField
  | IRatingField
  | ISectionField
  | IShortTextField
  | IStatementField
  | ITableField
  | IYesNoField

/**
 * Form field POJO with id
 */
export type FormFieldWithId = FormField & { _id: string }
