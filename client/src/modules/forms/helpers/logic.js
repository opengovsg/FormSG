// Basically a clone of backend/src/modules/submission/submission.utils.ts without
// types, as the shared utility was unable to receive types from the backend.
// !!! Keep in sync with backend/src/modules/submission/submission.utils.ts

function allConditionsExist(conditions, formFieldIds) {
  return conditions.every((condition) =>
    formFieldIds.has(String(condition.field)),
  )
}

function groupLogicUnitsByField(form) {
  const formId = form._id
  const formLogics = form.form_logics.filter(isShowFieldsLogic) || []
  const formFieldIds = new Set(
    form.form_fields.map((field) => String(field._id)),
  )

  /** An index of logic units keyed by the field id to be shown. */
  const logicUnitsGroupedByField = {}

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

function findConditionField(submission, fieldId) {
  return submission.find(
    (submittedField) => String(submittedField._id) === String(fieldId),
  )
}
function getCurrentValue(field) {
  if ('fieldValue' in field) {
    // client
    return field.fieldValue
  } else if ('answer' in field) {
    // server
    return field.answer
  }
  return null
}

function isConditionFulfilled(field, condition) {
  if (!field || !condition) {
    return false
  }

  let currentValue = getCurrentValue(field)
  if (
    currentValue === null ||
    currentValue === undefined ||
    currentValue.length === 0
  ) {
    return false
  }

  if (
    condition.state === LogicConditionState.Equal ||
    condition.state === LogicConditionState.Either
  ) {
    // condition.value can be a string (is equals to), or an array (is either)
    const conditionValues = [].concat(condition.value).map(String)
    currentValue = String(currentValue)
    /**
     * Handling 'Others' for radiobutton
     * form_logics: [{ ... value : 'Others' }]
     * Client-side:
     * When an Others radiobutton is checked, the fieldValue is 'radioButtonOthers'
     *
     * Server-side:
     * When an Others radiobutton is checked, and submitted with the required value,
     * the answer is: 'Others: value'
     */

    // TODO: An option that is named "Others: Something..." will also pass this test,
    // even if the field has not been configured to set othersRadioButton=true
    if (conditionValues.indexOf('Others') > -1) {
      if (field.fieldType === 'radiobutton') {
        conditionValues.push('radioButtonOthers')
      } else if (field.fieldType === 'checkbox') {
        conditionValues.push('checkboxOthers') // Checkbox currently doesn't have logic, but the 'Others' will work in the future if it in implemented
      }
      return (
        conditionValues.indexOf(currentValue) > -1 || // Client-side
        currentValue.startsWith('Others: ')
      ) // Server-side
    }
    return conditionValues.indexOf(currentValue) > -1
  } else if (condition.state === 'is less than or equal to') {
    return Number(currentValue) <= Number(condition.value)
  } else if (condition.state === 'is more than or equal to') {
    return Number(currentValue) >= Number(condition.value)
  } else {
    return false
  }
}

function isLogicUnitSatisfied(submission, logicUnit, visibleFieldIds) {
  return logicUnit.every((condition) => {
    const conditionField = findConditionField(submission, condition.field)
    return (
      conditionField &&
      visibleFieldIds.has(conditionField._id.toString()) &&
      isConditionFulfilled(conditionField, condition)
    )
  })
}

function getVisibleFieldIds(submission, form) {
  const logicUnitsGroupedByField = groupLogicUnitsByField(form)
  const visibleFieldIds = new Set()
  // Loop continues until no more changes made
  let changesMade = true
  while (changesMade) {
    changesMade = false
    form.form_fields.forEach((field) => {
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

function getPreventSubmitConditions(form) {
  const formFieldIds = new Set(
    form.form_fields.map((field) => String(field._id)),
  )
  const preventFormLogics =
    form.form_logics.filter(
      (formLogic) =>
        isPreventSubmitLogic(formLogic) &&
        allConditionsExist(formLogic.conditions, formFieldIds),
    ) || []

  return preventFormLogics
}

function getLogicUnitPreventingSubmit(submission, form, visibleFieldIds) {
  const definedVisibleFieldIds =
    visibleFieldIds || getVisibleFieldIds(submission, form)
  const preventSubmitConditions = getPreventSubmitConditions(form)
  return preventSubmitConditions.find((logicUnit) =>
    isLogicUnitSatisfied(
      submission,
      logicUnit.conditions,
      definedVisibleFieldIds,
    ),
  )
}

module.exports = {
  groupLogicUnitsByField,
  getLogicUnitPreventingSubmit,
  getVisibleFieldIds,
}
