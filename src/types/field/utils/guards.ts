/* Type guards */
import {
  IHomenoField,
  ILongTextField,
  INricField,
  IRadioField,
  IRatingField,
  ISectionFieldSchema,
  IShortTextField,
} from 'src/types/field'
import { IField } from 'src/types/field/baseField'

import { BasicField } from '../../../types/field/fieldTypes'

export const isSectionField = (
  formField: IField,
): formField is ISectionFieldSchema => {
  return formField.fieldType === BasicField.Section
}

export const isShortTextField = (
  formField: IField,
): formField is IShortTextField => {
  return formField.fieldType === BasicField.ShortText
}

export const isLongTextField = (
  formField: IField,
): formField is ILongTextField => {
  return formField.fieldType === BasicField.LongText
}

export const isNricField = (formField: IField): formField is INricField => {
  return formField.fieldType === BasicField.Nric
}

export const isHomeNumberField = (
  formField: IField,
): formField is IHomenoField => {
  return formField.fieldType === BasicField.HomeNo
}

export const isRadioButtonField = (
  formField: IField,
): formField is IRadioField => {
  return formField.fieldType === BasicField.Radio
}

export const isRatingField = (formField: IField): formField is IRatingField => {
  return formField.fieldType === BasicField.Rating
}
