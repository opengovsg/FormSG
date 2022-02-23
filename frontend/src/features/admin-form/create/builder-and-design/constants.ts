import { BasicField } from '~shared/types/field'

const ALL_FIELDS_ORDERED = [
  // Page section
  BasicField.Section,
  BasicField.Statement,
  BasicField.Image,
  // Fields section
  BasicField.ShortText,
  BasicField.LongText,
  BasicField.Radio,
  BasicField.Checkbox,
  BasicField.Mobile,
  BasicField.Email,
  BasicField.HomeNo,
  BasicField.Dropdown,
  BasicField.YesNo,
  BasicField.Rating,
  BasicField.Number,
  BasicField.Decimal,
  BasicField.Attachment,
  BasicField.Date,
  BasicField.Table,
  BasicField.Nric,
  BasicField.Uen,
]

export const CREATE_PAGE_FIELDS_ORDERED = ALL_FIELDS_ORDERED.slice(0, 3)
export const CREATE_FIELD_FIELDS_ORDERED = ALL_FIELDS_ORDERED.slice(3)

export const CREATE_PAGE_DROP_ID = 'create-fields-page'
export const CREATE_FIELD_DROP_ID = 'create-fields-field'

export const FIELD_LIST_DROP_ID = 'formFieldList'
export const PENDING_CREATE_FIELD_ID = 'FIELD-PENDING-CREATION'
