import { LOGIC_MAP } from '../../../../../shared/util/logic'
import { BasicField, IField, LogicConditionState } from '../../../../../types'

/**
 * Given a list of form fields, returns only the fields that are
 * allowed to be present in the if-condition dropdown in the Logic tab.
 */
export const getApplicableIfFields = (formFields: IField[]): IField[] =>
  formFields.filter((field) => !!LOGIC_MAP.get(field.fieldType))

/**
 * Given a single form field type, returns the applicable logic states for that field type.
 */
export const getApplicableIfStates = (
  fieldType: BasicField,
): LogicConditionState[] => LOGIC_MAP.get(fieldType) ?? []
