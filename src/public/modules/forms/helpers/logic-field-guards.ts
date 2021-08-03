import {
  BasicField,
  ICheckboxField,
  IDecimalField,
  IDropdownField,
  IField,
  INumberField,
  IRadioField,
  IRatingField,
} from '../../../../types'

export const isCheckboxField = (field: IField): field is ICheckboxField => {
  return field.fieldType === BasicField.Checkbox
}

export const isDropdownField = (field: IField): field is IDropdownField => {
  return field.fieldType === BasicField.Dropdown
}

export const isRadioButtonField = (field: IField): field is IRadioField => {
  return field.fieldType === BasicField.Radio
}

export const isRatingField = (field: IField): field is IRatingField => {
  return field.fieldType === BasicField.Rating
}

export const isDecimalField = (field: IField): field is IDecimalField => {
  return field.fieldType === BasicField.Decimal
}

export const isNumberField = (field: IField): field is INumberField => {
  return field.fieldType === BasicField.Number
}
