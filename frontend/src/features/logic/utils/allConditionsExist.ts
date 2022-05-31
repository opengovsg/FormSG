import { FormCondition } from '~shared/types'

import { FieldIdToType } from '../types'

/**
 * Checks if the field ids in logic's conditions all exist in the fieldIds.
 * @param conditions the list of conditions to check
 * @param visibleFieldMap map containing all visible field ids to their corresponding field
 * @returns true if every condition's related form field id exists in the set of formFieldIds, false otherwise.
 */
export const allConditionsExist = (
  conditions: FormCondition[],
  visibleFieldMap: FieldIdToType,
): boolean => {
  return conditions.every((c) => visibleFieldMap[c.field])
}
