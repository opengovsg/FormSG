/* Type guards */
import {
  ILongTextField,
  ISectionFieldSchema,
  IShortTextField,
} from 'src/types/field'
import { IField } from 'src/types/field/baseField'

export const isSectionField = (
  formField: IField,
): formField is ISectionFieldSchema => {
  return formField.fieldType === 'section'
}

export const isShortTextField = (
  formField: IField,
): formField is IShortTextField => {
  return formField.fieldType === 'textfield'
}

export const isLongTextField = (
  formField: IField,
): formField is ILongTextField => {
  return formField.fieldType === 'textarea'
}
