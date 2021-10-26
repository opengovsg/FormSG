import {
  FieldIdSet,
  GroupedLogic,
  isShowFieldsLogic,
  allConditionsExist,
  LogicFieldSchemaOrResponse,
  isLogicUnitSatisfied,
} from '../../src/shared/util/logic'
import { IFormDocument } from '../../src/types'

/**
 * Parse logic into a map of fields that are shown/hidden depending on the
 * values of other fields.
 * Discards invalid logic, where the id in show or conditions do not exist in
 * the form_field.
 *
 * @example
 * Show Email (_id: 1001) and Number (_id: 1002) if Dropdown (_id: 1003) is "Option 1" and Yes_No (_id: 1004) is "Yes"
  Then,
  form_logics: [
    {
      show: ["1001","1002"],
      conditions: [
        {field: "1003", ifValueType: "single-select", state: "is equals to", value: "Option 1"},
        {field: "1004", ifValueType: "single-select", state: "is equals to", value: "Yes"}
       ]
    }
  ]

  logicUnitsGroupedByField:
  {
    "1001": [ [{field: "1003", ifValueType: "single-select", state: "is equals to", value: "Option 1"},
        {field: "1004", ifValueType: "single-select", state: "is equals to", value: "Yes"}] ],
    "1002": [ [{field: "1003", ifValueType: "single-select", state: "is equals to", value: "Option 1"},
        {field: "1004", ifValueType: "single-select", state: "is equals to", value: "Yes"}] ]
  }
 * @caption If "1001" is deleted, "1002" will still be rendered since we just won't add "1001" into logicUnitsGroupedByField
 *
 * @param form the form object to group its logic by field for
 * @returns an object containing fields to be displayed and their corresponding conditions, keyed by id of the displayable field
 */
export const groupLogicUnitsByField = (form: IFormDocument): GroupedLogic => {
  const formId = form._id
  const formLogics = form.form_logics?.filter(isShowFieldsLogic) ?? []
  const formFieldIds = new Set(
    form.form_fields?.map((field) => String(field._id)),
  )

  /** An index of logic units keyed by the field id to be shown. */
  const logicUnitsGroupedByField: GroupedLogic = {}

  let hasInvalidLogic = false
  formLogics.forEach(function (logicUnit) {
    // Only add fields with valid logic conditions to the returned map.
    if (allConditionsExist(logicUnit.conditions, formFieldIds)) {
      logicUnit.show.forEach(function (fieldId) {
        fieldId = String(fieldId)
        if (formFieldIds.has(fieldId)) {
          logicUnitsGroupedByField[fieldId] = logicUnitsGroupedByField[fieldId]
            ? logicUnitsGroupedByField[fieldId]
            : []
          logicUnitsGroupedByField[fieldId].push(logicUnit.conditions)
        }
      })
    } else {
      hasInvalidLogic = true
    }
  })
  if (hasInvalidLogic && formId)
    console.info(`formId="${form._id}" message="Form has invalid logic"`)
  return logicUnitsGroupedByField
}

/**
 * Gets the IDs of visible fields in a form according to its responses.
 * This function loops through all the form fields until the set of visible
 * fields no longer changes. The first loop adds all the fields with no
 * conditions attached, the second adds fields which are made visible due to fields added in the previous loop, and so on.
 * @param submission the submission responses to retrieve logic units for. Can be `form_fields` (on client), or `req.body.responses` (on server)
 * @param form the form document for the submission
 * @returns a set of IDs of visible fields in the submission
 */
export const getVisibleFieldIds = (
  submission: LogicFieldSchemaOrResponse[],
  form: IFormDocument,
): FieldIdSet => {
  const logicUnitsGroupedByField = groupLogicUnitsByField(form)
  const visibleFieldIds: FieldIdSet = new Set()
  // Loop continues until no more changes made
  let changesMade = true
  while (changesMade) {
    changesMade = false
    form.form_fields?.forEach((field) => {
      const logicUnits = logicUnitsGroupedByField[String(field._id)]
      // If a field's visibility does not have any conditions, it is always
      // visible.
      // Otherwise, a field's visibility can be toggled by a combination of
      // conditions.
      // Eg. the following are logicUnits - just one of them has to be satisfied
      // 1) Show X if Y=yes and Z=yes
      // Or
      // 2) Show X if A=1
      if (
        !visibleFieldIds.has(field._id.toString()) &&
        (!logicUnits ||
          logicUnits.some((logicUnit) =>
            isLogicUnitSatisfied(submission, logicUnit, visibleFieldIds),
          ))
      ) {
        visibleFieldIds.add(field._id.toString())
        changesMade = true
      }
    })
  }
  return visibleFieldIds
}
