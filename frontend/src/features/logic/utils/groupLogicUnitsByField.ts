import { LogicDto } from '~shared/types/form'

import { FieldIdToType, GroupedLogicMeta } from '../types'

import { allConditionsExist } from './allConditionsExist'
import { isShowFieldsLogic } from './typeguards'

/**
 * Parse logic into a map of fields that are shown/hidden depending on the
 * values of other fields.
 * Discards invalid logic, where the id in show or conditions do not exist in
 * the form_field.
 *
 * @example
 * // Show email (_id: 1001) and Number (_id: 1002) if Dropdown (_id: 1003) is "Option 1" and Yes_No (_id: 1004) is "Yes"
 * formLogics = [
 *   {
 *     show: ['1001', '1002'],
 *     conditions: [
 *       {
 *         field: '1003',
 *         ifValueType: 'single-select',
 *         state: 'is equals to',
 *         value: 'Option 1',
 *       },
 *       {
 *         field: '1004',
 *         ifValueType: 'single-select',
 *         state: 'is equals to',
 *         value: 'Yes',
 *       },
 *     ],
 *   },
 * ]
 *
 * meta.groupedLogic = {
 *   '1001': [
 *     [
 *       {
 *         field: '1003',
 *         ifValueType: 'single-select',
 *         state: 'is equals to',
 *         value: 'Option 1',
 *       },
 *       {
 *         field: '1004',
 *         ifValueType: 'single-select',
 *         state: 'is equals to',
 *         value: 'Yes',
 *       },
 *     ],
 *   ],
 *   '1002': [
 *     [
 *       {
 *         field: '1003',
 *         ifValueType: 'single-select',
 *         state: 'is equals to',
 *         value: 'Option 1',
 *       },
 *       {
 *         field: '1004',
 *         ifValueType: 'single-select',
 *         state: 'is equals to',
 *         value: 'Yes',
 *       },
 *     ],
 *   ],
 * }
 * @caption If "1001" is deleted, "1002" will still be rendered since we just won't add "1001" into logicUnitsGroupedByField
 *
 * @param formLogics the logic units to group using the form field ids
 * @param idToFieldTypeMap map whose keys are used to group logic units with.
 * @returns an object containing the grouped logic units and a boolean indicating if any of the form logic units are invalid.
 */
export const groupLogicUnitsByField = (
  formLogics: LogicDto[],
  idToFieldTypeMap: FieldIdToType,
) => {
  const filteredFormLogics = formLogics.filter(isShowFieldsLogic)

  /** An index of logic units keyed by the field id to be shown. */
  const logicUnitsGroupedByField = filteredFormLogics.reduce<GroupedLogicMeta>(
    (acc, logicUnit) => {
      const hasAllConditions = allConditionsExist(
        logicUnit.conditions,
        idToFieldTypeMap,
      )
      if (!hasAllConditions) {
        acc.hasInvalidLogic = true
        return acc
      }
      logicUnit.show.forEach((fieldId) => {
        if (idToFieldTypeMap[fieldId]) {
          acc.groupedLogic[fieldId] = acc.groupedLogic[fieldId]
            ? acc.groupedLogic[fieldId]
            : []
          acc.groupedLogic[fieldId].push(logicUnit.conditions)
        }
      })
      return acc
    },
    { hasInvalidLogic: false, groupedLogic: {} },
  )
  return logicUnitsGroupedByField
}
