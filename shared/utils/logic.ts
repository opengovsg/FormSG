import {
  BasicField,
  FormDto,
  LogicConditionState,
  LogicType,
  FormCondition,
  LogicDto,
  ShowFieldLogicDto,
  PreventSubmitLogicDto,
  LogicCondition,
  LogicableField,
} from '../types'

// TODO: Keep this in sync with the frontend value.
// Exported for testing
export const RADIO_OTHERS_INPUT_VALUE = '!!FORMSG_INTERNAL_RADIO_OTHERS_VALUE!!'

const LOGIC_CONDITIONS: LogicCondition[] = [
  [
    BasicField.Dropdown,
    [LogicConditionState.Equal, LogicConditionState.Either],
  ],
  [
    BasicField.Number,
    [
      LogicConditionState.Equal,
      LogicConditionState.Lte,
      LogicConditionState.Gte,
    ],
  ],
  [
    BasicField.Decimal,
    [
      LogicConditionState.Equal,
      LogicConditionState.Lte,
      LogicConditionState.Gte,
    ],
  ],
  [
    BasicField.Rating,
    [
      LogicConditionState.Equal,
      LogicConditionState.Lte,
      LogicConditionState.Gte,
    ],
  ],
  [BasicField.YesNo, [LogicConditionState.Equal]],
  [BasicField.Radio, [LogicConditionState.Equal, LogicConditionState.Either]],
]

export const LOGIC_MAP = new Map<BasicField, LogicConditionState[]>(
  LOGIC_CONDITIONS,
)

/**
 * Given a single form field type, returns the applicable logic states for that field type.
 */
export const getApplicableIfStates = (
  fieldType: BasicField,
): LogicConditionState[] => LOGIC_MAP.get(fieldType) ?? []

export const isValueStringArray = (
  value: FormCondition['value'],
): value is string[] => {
  // use .some because of limitation of typescript in calling .every() on union of array types: https://github.com/microsoft/TypeScript/issues/44373
  return Array.isArray(value) && !value.some((v) => typeof v === 'number')
}

/**
 * Utility function to trim condition.value strings
 * Trim logic condition for backward compability as some logic conditions have trailing whitespace
 */
const trimConditionValue = (condition: FormCondition) => ({
  field: condition.field,
  state: condition.state,
  value: isValueStringArray(condition.value)
    ? condition.value.map((value) => value.trim())
    : typeof condition.value === 'string'
    ? condition.value.trim()
    : condition.value,
  ifValueType: condition.ifValueType,
})

type GroupedLogic = Record<string, FormCondition[][]>

export type FieldIdSet = Set<LogicFieldClientResponse['_id']>
// This module handles logic on both the client side (LogicFieldClientResponse)
// and server side (LogicFieldServerResponse)
export type LogicFieldClientRadioResponseInput = {
  value?: string
  othersInput?: string
}
type LogicFieldClientLogicableRadioResponse = {
  _id: string
  fieldType: BasicField.Radio
  input: LogicFieldClientRadioResponseInput
}
type LogicFieldClientLogicableNonRadioResponse = {
  _id: string
  fieldType: Exclude<LogicableField, BasicField.Radio>
  input?: string
}
type LogicFieldClientNonLogicableResponse = {
  _id: string
  fieldType: Exclude<BasicField, LogicableField>
}
export type LogicFieldClientResponse =
  | LogicFieldClientLogicableRadioResponse
  | LogicFieldClientLogicableNonRadioResponse
  | LogicFieldClientNonLogicableResponse

type LogicFieldServerLogicableResponse = {
  _id: string
  fieldType: LogicableField
  answer: string
}
type LogicFieldServerNonLogicableResponse = {
  _id: string
  fieldType: Exclude<BasicField, LogicableField>
}
export type LogicFieldServerResponse =
  | LogicFieldServerLogicableResponse
  | LogicFieldServerNonLogicableResponse

export type LogicFieldResponse =
  | LogicFieldClientResponse
  | LogicFieldServerResponse

// Returns typed ShowFields logic unit
const isShowFieldsLogic = (
  formLogic: LogicDto,
): formLogic is ShowFieldLogicDto => {
  return formLogic.logicType === LogicType.ShowFields
}

// Returns typed PreventSubmit logic unit
const isPreventSubmitLogic = (
  formLogic: LogicDto,
): formLogic is PreventSubmitLogicDto => {
  return formLogic.logicType === LogicType.PreventSubmit
}

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
export const groupLogicUnitsByField = ({
  form_logics,
  form_fields,
}: Pick<FormDto, 'form_fields' | 'form_logics'>): GroupedLogic => {
  const formLogics = form_logics?.filter(isShowFieldsLogic) ?? []
  const formFieldIds = new Set(form_fields?.map((field) => String(field._id)))

  /** An index of logic units keyed by the field id to be shown. */
  const logicUnitsGroupedByField: GroupedLogic = {}

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
    }
  })
  return logicUnitsGroupedByField
}

/**
 * Parse logic to get a list of conditions where, if any condition in this list
 * is fulfilled, form submission is prevented.
 * @param form the form document to check
 * @returns array of conditions that prevent submission, can be empty
 */
const getPreventSubmitConditions = ({
  form_fields,
  form_logics,
}: Pick<FormDto, 'form_fields' | 'form_logics'>): PreventSubmitLogicDto[] => {
  const formFieldIds = new Set(form_fields?.map((field) => String(field._id)))

  const preventFormLogics =
    form_logics?.filter(
      (formLogic): formLogic is PreventSubmitLogicDto =>
        isPreventSubmitLogic(formLogic) &&
        allConditionsExist(formLogic.conditions, formFieldIds),
    ) ?? []

  return preventFormLogics
}

/**
 * Determines whether the submission should be prevented by form logic. If so,
 * return the condition preventing the submission. If not, return undefined.
 * @param submission the submission responses to retrieve logic units for. Can be `form_fields` (on client), or `req.body.responses` (on server)
 * @param form the form document for the submission
 * @param visibleFieldIds the set of currently visible fields. Optional for testing purposes
 * @returns a condition if submission is to prevented, otherwise `undefined`
 */
export const getLogicUnitPreventingSubmit = (
  submission: LogicFieldResponse[],
  form: Pick<FormDto, 'form_fields' | 'form_logics'>,
  visibleFieldIds?: FieldIdSet,
): PreventSubmitLogicDto | undefined => {
  const definedVisibleFieldIds =
    visibleFieldIds ?? getVisibleFieldIds(submission, form)
  const preventSubmitConditions = getPreventSubmitConditions(form)
  return preventSubmitConditions.find((logicUnit) =>
    isLogicUnitSatisfied(
      submission,
      logicUnit.conditions,
      definedVisibleFieldIds,
    ),
  )
}

/**
 * Checks if the field ids in logic's conditions all exist in the fieldIds.
 * @param conditions the list of conditions to check
 * @param formFieldIds the set of form field ids to check
 * @returns true if every condition's related form field id exists in the set of formFieldIds, false otherwise.
 */
const allConditionsExist = (
  conditions: FormCondition[],
  formFieldIds: FieldIdSet,
): boolean => {
  return conditions.every((condition) =>
    formFieldIds.has(String(condition.field)),
  )
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
  submission: LogicFieldResponse[],
  form: Pick<FormDto, 'form_fields' | 'form_logics'>,
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

/**
 * Checks if an array of conditions is satisfied.
 * @param submission the submission responses to retrieve logic units for. Can be `form_fields` (on client), or `req.body.responses` (on server)
 * @param logicUnit an object containing the conditions specified in a single modal of `add new logic` on the form logic tab
 * @param visibleFieldIds the set of field IDs that are visible, which is used to ensure that conditions are visible
 * @returns true if all the conditions are satisfied, false otherwise
 */
const isLogicUnitSatisfied = (
  submission: LogicFieldResponse[],
  logicUnit: FormCondition[],
  visibleFieldIds: FieldIdSet,
): boolean =>
  logicUnit.every((condition) => {
    const conditionField = findConditionField(submission, condition.field)
    return (
      conditionField &&
      visibleFieldIds.has(conditionField._id.toString()) &&
      isConditionFulfilled(conditionField, condition)
    )
  })

const getCurrentValue = (
  field: LogicFieldResponse,
): string | LogicFieldClientRadioResponseInput | null | undefined => {
  if ('input' in field) {
    // client
    return field.input
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
const isConditionFulfilled = (
  field: LogicFieldResponse,
  condition: FormCondition,
): boolean => {
  let currentValue = getCurrentValue(field)

  // Trim the current value
  if (typeof currentValue === 'string') {
    currentValue = currentValue.trim()
  }

  if (
    currentValue === null ||
    currentValue === undefined ||
    currentValue === ''
  ) {
    return false
  }

  if (typeof currentValue !== 'string') {
    // Handle the case where the value is a client radio field value.
    currentValue = {
      ...currentValue,
      value: currentValue.value?.trim(),
    }
  }

  // Evaluate condition
  const trimmedCondition = trimConditionValue(condition)

  switch (trimmedCondition.state) {
    case LogicConditionState.Lte:
      return Number(currentValue) <= Number(trimmedCondition.value)
    case LogicConditionState.Gte:
      return Number(currentValue) >= Number(trimmedCondition.value)
    case LogicConditionState.Equal:
    case LogicConditionState.Either: {
      const conditionValues = Array.isArray(trimmedCondition.value)
        ? trimmedCondition.value
        : [trimmedCondition.value]

      /**
       * Field type   Radio       Decimal     Everything else
       * Server-side  (1)         (2)         (3)
       * Client-side  (4)         (5)         (6)
       *
       * (1) If conditionValues includes "Others", must check for radio answer
       *     starting with "Others: ".
       *     If not, continue the usual string-based check with (3).
       * (4) If conditionValues includes "Others", check for the value being
       *     special radio value and the othersInput subfield having a value.
       *     If not, continue the usual string-based check with (3).
       * (2) + (5) Use Number equality for decimals
       * (3) + (6) Use String equality for everything else
       */

      // Special radio others check
      if (
        field.fieldType === BasicField.Radio &&
        conditionValues.includes('Others')
      ) {
        if (typeof currentValue === 'string') {
          // Server-side handling
          if (currentValue.startsWith('Others: ')) {
            return true
          }
        } else {
          // Client-side handling
          if (
            currentValue.value === RADIO_OTHERS_INPUT_VALUE &&
            !!currentValue.othersInput
          ) {
            return true
          }
        }
      }

      // Bump client-side radio value nested in the object back up to the main level
      let currentValueString: string | undefined
      if (typeof currentValue !== 'string') {
        currentValueString = currentValue.value
      } else {
        currentValueString = currentValue
      }

      // Handle the rest of the cases (radio non-others, non-radio fields)
      if (field.fieldType === BasicField.Decimal) {
        return conditionValues.some(
          (conditionValue) =>
            Number(conditionValue) === Number(currentValueString),
        )
      }
      return conditionValues.some(
        (conditionValue) =>
          String(conditionValue) === String(currentValueString),
      )
    }
    default:
      return false
  }
}

/**
 * Find the field in the current submission corresponding to the condition to be
 * checked.
 * @param submission the submission responses to retrieve logic units for. Can be `form_fields` (on client), or `req.body.responses` (on server)
 * @param fieldId the id of condition field to find
 * @returns the condition field if it exists, `undefined` otherwise
 */
const findConditionField = (
  submission: LogicFieldResponse[],
  fieldId: FormCondition['field'],
): LogicFieldResponse | undefined => {
  return submission.find(
    (submittedField) => String(submittedField._id) === String(fieldId),
  )
}
