import { BasicField, LogicConditionState, LogicType } from 'shared/types'

import { ALL_FIELDS, E2eFieldMetadata } from './field'
import { E2eLogic } from './logic'

type E2eTestFormDefinition = {
  formFields: E2eFieldMetadata[]
  formLogics: E2eLogic[]
}

/**
 * Test where all fields are shown based on a single field logic
 */
const TEST_ALL_FIELDS_SHOWN_BY_LOGIC_FORMFIELDS: E2eFieldMetadata[] = [
  {
    title: 'Do you want to hide the fields?',
    fieldType: BasicField.YesNo,
    val: 'No',
  },
  // TODO: Attachment fields don't work on storage mode unless we spin up localstack.
  ...ALL_FIELDS.filter((field) => field.fieldType !== BasicField.Attachment),
]
export const TEST_ALL_FIELDS_SHOWN_BY_LOGIC: E2eTestFormDefinition = {
  formFields: TEST_ALL_FIELDS_SHOWN_BY_LOGIC_FORMFIELDS,
  formLogics: [
    // Single logic block: if "yes", show the fields.
    {
      conditions: [
        {
          field: 0,
          state: LogicConditionState.Equal,
          value: 'No',
        },
      ],
      logicType: LogicType.ShowFields,
      show: Array.from(
        TEST_ALL_FIELDS_SHOWN_BY_LOGIC_FORMFIELDS,
        (_, i) => i,
      ).slice(1),
    },
  ],
}

/**
 * Test where a field is hidden based on a single field logic
 */
const TEST_FIELD_HIDDEN_BY_LOGIC_FORMFIELDS: E2eFieldMetadata[] = [
  {
    title: 'Do you want to show the fields?',
    fieldType: BasicField.YesNo,
    val: 'No',
  },
  {
    title: 'This field should be hidden',
    fieldType: BasicField.ShortText,
    ValidationOptions: {
      selectedValidation: null,
      customVal: null,
    },
    val: '',
    hidden: true,
  },
]
export const TEST_FIELD_HIDDEN_BY_LOGIC: E2eTestFormDefinition = {
  formFields: TEST_FIELD_HIDDEN_BY_LOGIC_FORMFIELDS,
  formLogics: [
    // Single logic block: if "yes", show the fields.
    {
      conditions: [
        {
          field: 0,
          state: LogicConditionState.Equal,
          value: 'Yes',
        },
      ],
      logicType: LogicType.ShowFields,
      show: Array.from(
        TEST_FIELD_HIDDEN_BY_LOGIC_FORMFIELDS,
        (_, i) => i,
      ).slice(1),
    },
  ],
}

/**
 * Test where submission is disabled via chained logic
 */
const TEST_SUBMISSION_DISABLED_BY_CHAINED_LOGIC_MESSAGE = 'You shall not pass!'
const TEST_SUBMISSION_DISABLED_BY_CHAINED_LOGIC_FORMFIELDS: E2eFieldMetadata[] =
  [
    {
      title: 'Enter a number at least 10',
      fieldType: BasicField.Number,
      ValidationOptions: {
        selectedValidation: null,
        customVal: null,
      },
      val: '10',
    },
    {
      title: 'Favorite food',
      fieldType: BasicField.Dropdown,
      fieldOptions: ['Rice', 'Chocolate', 'Ice-Cream'],
      val: 'Chocolate',
    },
    {
      title: 'Do you want to submit this form?',
      fieldType: BasicField.YesNo,
      val: 'Yes',
    },
  ]
export const TEST_SUBMISSION_DISABLED_BY_CHAINED_LOGIC: E2eTestFormDefinition & {
  preventSubmitMessage: string
} = {
  formFields: TEST_SUBMISSION_DISABLED_BY_CHAINED_LOGIC_FORMFIELDS,
  formLogics: [
    {
      conditions: [
        {
          field: 0,
          state: LogicConditionState.Gte,
          value: '10',
        },
      ],
      logicType: LogicType.ShowFields,
      show: [1],
    },
    {
      conditions: [
        {
          field: 1,
          state: LogicConditionState.Either,
          value: ['Rice', 'Chocolate'],
        },
      ],
      logicType: LogicType.ShowFields,
      show: [2],
    },
    {
      conditions: [
        {
          field: 2,
          state: LogicConditionState.Equal,
          value: 'Yes',
        },
      ],
      logicType: LogicType.PreventSubmit,
      message: TEST_SUBMISSION_DISABLED_BY_CHAINED_LOGIC_MESSAGE,
    },
  ],
  preventSubmitMessage: TEST_SUBMISSION_DISABLED_BY_CHAINED_LOGIC_MESSAGE,
}
