import { LogicType } from '../../types'

/**
 * Parse logic into a map of fields that are shown/hidden depending on the values of other fields
 * Discards invalid logic, where the id in show or conditions do not exist in form_field
 *
 * Example:
  Show Email (_id: 1001) and Number (_id: 1002) if Dropdown (_id: 1003) is "Option 1" and Yes_No (_id: 1004) is "Yes"
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

  If "1001" is deleted, "1002" will still be rendered since we just won't add "1001" into logicUnitsGroupedByField
 *
 * @param {Object} form
 * @param {Mongoose.ObjectId} form._id : id of form
 * @param {Array} form.form_logics : An array of objects containing the conditions and ids of fields to be displayed. See FormLogicSchema
 * @param {Array} form.form_fields : An array of form fields containing the ids of the fields
 * @returns {Object} Object containing fields to be displayed and their corresponding conditions, keyed by id of the displayable field
 */
function groupLogicUnitsByField(form) {
  const formId = form._id
  const formLogics = form.form_logics.filter(
    (formLogic) => formLogic.logicType === LogicType.ShowFields,
  )
  const formFieldIds = new Set(
    form.form_fields.map((field) => String(field._id)),
  )

  /**
   * @type {Object.<string, Array<Array<ConditionSchema>>>} An index of logic units keyed by the field id to be shown. See FormLogicSchema
   */
  let logicUnitsGroupedByField = {}

  let hasInvalidLogic = false
  formLogics.forEach(function (logicUnit) {
    // Only add fields with valid logic conditions to the returned map
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
 * Parse logic to get a list of conditions where, if any condition in this list is
 * fulfilled, form submission is prevented.
 * @param {Object} form Form object
 * @returns {Array} Array of conditions to prevent submission
 */
function getPreventSubmitConditions(form) {
  const formFieldIds = new Set(
    form.form_fields.map((field) => String(field._id)),
  )
  return form.form_logics.filter((formLogic) => {
    return (
      formLogic.logicType === LogicType.PreventSubmit &&
      allConditionsExist(formLogic.conditions, formFieldIds)
    )
  })
}

/**
 * Determines whether the submission should be prevented by form logic. If so,
 * return the condition preventing the submission. If not, return undefined.
 * @param {Array} submission - form_fields (on client), or req.body.responses (on server)
 * @param {Object} form Form object
 * @param {Set} [visibleFieldIds] Optional set of currently visible fields. If this is not
 * provided, the function recomputes it.
 * @returns {Object} Condition if submission is to prevented, otherwise undefined
 */
function getLogicUnitPreventingSubmit(submission, form, visibleFieldIds) {
  if (!visibleFieldIds) {
    visibleFieldIds = getVisibleFieldIds(submission, form)
  }
  const preventSubmitConditions = getPreventSubmitConditions(form)
  return preventSubmitConditions.find((logicUnit) =>
    isLogicUnitSatisfied(submission, logicUnit.conditions, visibleFieldIds),
  )
}

/**
 * Checks if the field ids in logic's conditions all exist in the fieldIds
 *
 * @param {Array} conditions
 * @param {Set} formFieldIds
 * @returns {Boolean}
 */
function allConditionsExist(conditions, formFieldIds) {
  return conditions.every((condition) =>
    formFieldIds.has(String(condition.field)),
  )
}

/**
 * Gets the IDs of visible fields in a form according to its responses.
 * This function loops through all the form fields until the set of visible fields no longer
 * changes. The first loop adds all the fields with no conditions attached, the second adds
 * fields which are made visible due to fields added in the previous loop, and so on.
 * @param {Array} submission - form_fields (on client), or req.body.responses (on server)
 * @param {Object} form - Form object
 * @var {Array} logicUnits - Array of logic units
 * @returns {Set} Set of IDs of visible fields
 */
function getVisibleFieldIds(submission, form) {
  const logicUnitsGroupedByField = groupLogicUnitsByField(form)
  const visibleFieldIds = new Set()
  // Loop continues until no more changes made
  let changesMade = true
  while (changesMade) {
    changesMade = false
    form.form_fields.forEach((field) => {
      const logicUnits = logicUnitsGroupedByField[String(field._id)]
      // If a field's visibility does not have any conditions, it is always visible.
      // Otherwise, a field's visibility can be toggled by a combination of conditions.
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

/**
 * Checks if an array of conditions is satisfied.
 * @param {Object} submission - form_fields (on client), or req.body.responses (on server)
 * @param {Object} logicUnit - Object containing the conditions specified in a single modal of `add new logic` on the form logic tab
 * @param {Set} visibleFieldIds - Set of field IDs that are visible, which is used to ensure that conditions are visible
 */
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
/**
 * Checks if the field's value matches the condition
 * @param {Object} field
 * @param {Object} condition
 * @param {String} condition.state - The type of condition
 */
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
  } else if (
    condition.state === 'is equals to' ||
    condition.state === 'is either'
  ) {
    const conditionValues = [].concat(condition.value).map(String) // condition.value can be a string (is equals to), or an array (is either)
    currentValue = String(currentValue)
    /*
    Handling 'Others' for radiobutton

    form_logics: [{ ... value : 'Others' }]

    Client-side:
    When an Others radiobutton is checked, the fieldValue is 'radioButtonOthers'

    Server-side:
    When an Others radiobutton is checked, and submitted with the required value,
    the answer is: 'Others: value'
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

/**
 * Find the field in the current submission corresponding to the condition to be checked
 *
 * @param {Array} submission - form_fields (on client), or req.body.responses (on server)
 * @param {String} fieldId - id of condition field
 * @returns
 */
function findConditionField(submission, fieldId) {
  return submission.find(
    (submittedField) => String(submittedField._id) === String(fieldId),
  )
}

module.exports = {
  groupLogicUnitsByField,
  getVisibleFieldIds,
  getLogicUnitPreventingSubmit,
}
