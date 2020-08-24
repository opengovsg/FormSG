import { BasicField } from '../../../types'

interface IBasicFieldType {
  name: BasicField
  value: string
  submitted: boolean
}

export const types: IBasicFieldType[] = [
  {
    name: BasicField.Section,
    value: 'Header',
    submitted: true,
  },
  {
    name: BasicField.Statement,
    value: 'Statement',
    submitted: false,
  },
  {
    name: BasicField.Email,
    value: 'Email',
    submitted: true,
  },
  {
    name: BasicField.Mobile,
    value: 'Mobile Number',
    submitted: true,
  },
  {
    name: BasicField.HomeNo,
    value: 'Home Number',
    submitted: true,
  },
  {
    name: BasicField.Number,
    value: 'Number',
    submitted: true,
  },
  {
    name: BasicField.Decimal,
    value: 'Decimal',
    submitted: true,
  },
  {
    name: BasicField.Image,
    value: 'Image',
    submitted: false,
  },
  {
    name: BasicField.ShortText,
    value: 'Short Text',
    submitted: true,
  },
  {
    name: BasicField.LongText,
    value: 'Long Text',
    submitted: true,
  },
  {
    name: BasicField.Dropdown,
    value: 'Dropdown',
    submitted: true,
  },
  {
    name: BasicField.YesNo,
    value: 'Yes/No',
    submitted: true,
  },
  {
    name: BasicField.Checkbox,
    value: 'Checkbox',
    submitted: true,
  },
  {
    name: BasicField.Radio,
    value: 'Radio',
    submitted: true,
  },
  {
    name: BasicField.Attachment,
    value: 'Attachment',
    submitted: true,
  },
  {
    name: BasicField.Date,
    value: 'Date',
    submitted: true,
  },
  {
    name: BasicField.Rating,
    value: 'Rating',
    submitted: true,
  },
  {
    name: BasicField.Nric,
    value: 'NRIC',
    submitted: true,
  },
  {
    name: BasicField.Table,
    value: 'Table',
    submitted: true,
  },
]
