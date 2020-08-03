export type FieldType =
  | 'section'
  | 'statement'
  | 'email'
  | 'mobile'
  | 'homeno'
  | 'number'
  | 'decimal'
  | 'image'
  | 'textfield'
  | 'textarea'
  | 'dropdown'
  | 'yes_no'
  | 'checkbox'
  | 'radiobutton'
  | 'attachment'
  | 'date'
  | 'rating'
  | 'nric'
  | 'table'

interface IBasicFieldType {
  name: FieldType
  value: string
  submitted: boolean
}

export const types: IBasicFieldType[] = [
  {
    name: 'section',
    value: 'Header',
    submitted: true,
  },
  {
    name: 'statement',
    value: 'Statement',
    submitted: false,
  },
  {
    name: 'email',
    value: 'Email',
    submitted: true,
  },
  {
    name: 'mobile',
    value: 'Mobile Number',
    submitted: true,
  },
  {
    name: 'homeno',
    value: 'Home Number',
    submitted: true,
  },
  {
    name: 'number',
    value: 'Number',
    submitted: true,
  },
  {
    name: 'decimal',
    value: 'Decimal',
    submitted: true,
  },
  {
    name: 'image',
    value: 'Image',
    submitted: false,
  },
  {
    name: 'textfield',
    value: 'Short Text',
    submitted: true,
  },
  {
    name: 'textarea',
    value: 'Long Text',
    submitted: true,
  },
  {
    name: 'dropdown',
    value: 'Dropdown',
    submitted: true,
  },
  {
    name: 'yes_no',
    value: 'Yes/No',
    submitted: true,
  },
  {
    name: 'checkbox',
    value: 'Checkbox',
    submitted: true,
  },
  {
    name: 'radiobutton',
    value: 'Radio',
    submitted: true,
  },
  {
    name: 'attachment',
    value: 'Attachment',
    submitted: true,
  },
  {
    name: 'date',
    value: 'Date',
    submitted: true,
  },
  {
    name: 'rating',
    value: 'Rating',
    submitted: true,
  },
  {
    name: 'nric',
    value: 'NRIC',
    submitted: true,
  },
  {
    name: 'table',
    value: 'Table',
    submitted: true,
  },
]
