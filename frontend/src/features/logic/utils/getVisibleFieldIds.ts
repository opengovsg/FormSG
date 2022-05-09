import {
  DeepPartial,
  DeepPartialSkipArrayKey,
  UnpackNestedValue,
} from 'react-hook-form'
import { CamelCasedProperties } from 'type-fest'

import { FormCondition, FormDto } from '~shared/types/form'

import { FormFieldValues } from '~templates/Field'

import { FieldIdSet, FieldIdToType } from '../types'

import { groupLogicUnitsByField } from './groupLogicUnitsByField'
import { isConditionFulfilled } from './isConditionFulfilled'

/**
 * Checks if an array of conditions is satisfied.
 * @param formInputs the inputs to the form to retrieve logic units for.
 * @param logicUnit the logic units to check.
 * @param visibleFieldMap the map with visible field ids as keys, which is used to ensure that conditions are visible
 * @returns true if all the conditions are satisfied, false otherwise
 */
const isLogicUnitSatisfied = (
  formInputs: DeepPartial<FormFieldValues>,
  logicUnit: FormCondition[],
  visibleFieldMap: FieldIdToType,
): boolean => {
  return logicUnit.every((condition) => {
    const inputFieldType = visibleFieldMap[condition.field]
    // If the field is not visible, then the field type will not be in the map.
    if (!inputFieldType) return false
    const input = formInputs[condition.field]
    return (
      input !== undefined &&
      isConditionFulfilled(input, condition, inputFieldType)
    )
  })
}

/**
 * Gets the IDs of visible fields in a form according to its responses.
 * This function loops through all the form fields until the set of visible
 * fields no longer changes. The first loop adds all the fields with no
 * conditions attached, the second adds fields which are made visible due to fields added in the previous loop, and so on.
 * @param formInputs the field responses to retrieve logic units for.
 * @param formProps the form fields and form logics to determine visible field ids.
 * @returns a set of IDs of visible fields in the submission
 */
export const getVisibleFieldIds = (
  formInputs: UnpackNestedValue<DeepPartialSkipArrayKey<FormFieldValues>>,
  {
    formFields,
    formLogics,
  }: CamelCasedProperties<Pick<FormDto, 'form_fields' | 'form_logics'>>,
): FieldIdSet => {
  const idToFieldTypeMap = formFields.reduce<FieldIdToType>((acc, ff) => {
    acc[ff._id] = ff.fieldType
    return acc
  }, {})

  const { groupedLogic } = groupLogicUnitsByField(formLogics, idToFieldTypeMap)
  const visibleFieldMap: FieldIdToType = {}
  // Loop continues until no more changes made
  let changesMade = true
  while (changesMade) {
    changesMade = false
    // eslint-disable-next-line no-loop-func
    formFields.forEach((field) => {
      const logicUnits = groupedLogic[field._id]
      // If a field's visibility does not have any conditions, it is always
      // visible.
      // Otherwise, a field's visibility can be toggled by a combination of
      // conditions.
      // Eg. the following are logicUnits - just one of them has to be satisfied
      // 1) Show X if Y=yes and Z=yes
      // Or
      // 2) Show X if A=1
      if (
        !visibleFieldMap[field._id] &&
        (!logicUnits ||
          logicUnits.some((logicUnit) =>
            isLogicUnitSatisfied(formInputs, logicUnit, visibleFieldMap),
          ))
      ) {
        visibleFieldMap[field._id] = field.fieldType
        changesMade = true
      }
    })
  }

  return new Set(Object.keys(visibleFieldMap))
}
