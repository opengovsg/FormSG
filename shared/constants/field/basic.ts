import { BasicField } from '../../types/field'

type BasicFieldBlock = {
  /** Type of field */
  name: BasicField
  /** Default name of field */
  value: string
  /** Whether field is to be submittable */
  submitted: boolean
  /** Whether field is multi-answer */
  answerArray: boolean
}

export const types: BasicFieldBlock[] = [
  {
    name: BasicField.Section,
    value: 'Header',
    submitted: true,
    answerArray: false,
  },
  {
    name: BasicField.Statement,
    value: 'Statement',
    submitted: false,
    answerArray: false,
  },
  {
    name: BasicField.Email,
    value: 'Email',
    submitted: true,
    answerArray: false,
  },
  {
    name: BasicField.Mobile,
    value: 'Mobile Number',
    submitted: true,
    answerArray: false,
  },
  {
    name: BasicField.HomeNo,
    value: 'Home Number',
    submitted: true,
    answerArray: false,
  },
  {
    name: BasicField.Number,
    value: 'Number',
    submitted: true,
    answerArray: false,
  },
  {
    name: BasicField.Decimal,
    value: 'Decimal',
    submitted: true,
    answerArray: false,
  },
  {
    name: BasicField.Image,
    value: 'Image',
    submitted: false,
    answerArray: false,
  },
  {
    name: BasicField.ShortText,
    value: 'Short Text',
    submitted: true,
    answerArray: false,
  },
  {
    name: BasicField.LongText,
    value: 'Long Text',
    submitted: true,
    answerArray: false,
  },
  {
    name: BasicField.Dropdown,
    value: 'Dropdown',
    submitted: true,
    answerArray: false,
  },
  {
    name: BasicField.CountryRegion,
    value: 'Country/Region',
    submitted: true,
    answerArray: false,
  },
  {
    name: BasicField.YesNo,
    value: 'Yes/No',
    submitted: true,
    answerArray: false,
  },
  {
    name: BasicField.Checkbox,
    value: 'Checkbox',
    submitted: true,
    answerArray: true,
  },
  {
    name: BasicField.Radio,
    value: 'Radio',
    submitted: true,
    answerArray: false,
  },
  {
    name: BasicField.Attachment,
    value: 'Attachment',
    submitted: true,
    answerArray: false,
  },
  {
    name: BasicField.Date,
    value: 'Date',
    submitted: true,
    answerArray: false,
  },
  {
    name: BasicField.Rating,
    value: 'Rating',
    submitted: true,
    answerArray: false,
  },
  {
    name: BasicField.Nric,
    value: 'NRIC',
    submitted: true,
    answerArray: false,
  },
  {
    name: BasicField.Uen,
    value: 'UEN',
    submitted: true,
    answerArray: false,
  },
  {
    name: BasicField.Table,
    value: 'Table',
    submitted: true,
    answerArray: true,
  },
]

/**
 * Array of BasicFields which are not included in the form response (e.g. statement)
 */
export const FIELDS_TO_REJECT: BasicField[] = types
  .filter((f) => !f.submitted)
  .map((f) => f.name)
