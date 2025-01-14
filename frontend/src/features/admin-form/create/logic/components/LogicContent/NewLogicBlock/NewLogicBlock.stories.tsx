import { Box } from '@chakra-ui/react'
import { Meta, StoryFn } from '@storybook/react'

import {
  BasicField,
  DecimalFieldBase,
  DropdownFieldBase,
  FormFieldWithId,
  NumberFieldBase,
  RadioFieldBase,
  RatingFieldBase,
  YesNoFieldBase,
} from '~shared/types/field'
import {
  FormCondition,
  LogicConditionState,
  LogicType,
} from '~shared/types/form'

import {
  createFormBuilderMocks,
  MOCK_FORM_FIELDS,
} from '~/mocks/msw/handlers/admin-form'

import { getMobileViewParameters, StoryRouter } from '~utils/storybook'

import { FormFieldWithQuestionNo } from '~features/form/types'

import { NewLogicBlock, NewLogicBlockProps } from './NewLogicBlock'

export default {
  title: 'Features/AdminForm/Logic/NewLogicBlock',
  component: NewLogicBlock,
  // Padding decorator so boxShadow gets snapshotted too.
  decorators: [
    (storyFn) => <Box p="0.5rem">{storyFn()}</Box>,
    StoryRouter({
      initialEntries: ['/61540ece3d4a6e50ac0cc6ff'],
      path: '/:formId',
    }),
  ],
  parameters: {
    // Required so skeleton "animation" does not hide content.
    chromatic: { pauseAnimationAtEnd: true, delay: 200 },
    msw: createFormBuilderMocks({ form_fields: MOCK_FORM_FIELDS }, 0),
  },
} as Meta

const MAP_ID_TO_FIELD = MOCK_FORM_FIELDS.reduce(
  (acc, field, index) => {
    acc[field._id] = { ...field, questionNumber: index + 1 }
    return acc
  },
  {} as Record<string, FormFieldWithQuestionNo>,
)
const FIELD_TYPE_TO_ID = MOCK_FORM_FIELDS.reduce(
  (acc, field) => {
    acc[field.fieldType] = field._id
    return acc
  },
  {} as Record<BasicField, string>,
)

const Template: StoryFn<NewLogicBlockProps> = (args) => (
  <NewLogicBlock {...args} />
)

export const Default = Template.bind({})

export const AllLogicConditions = Template.bind({})
AllLogicConditions.args = {
  _defaultValues: {
    conditions: generateAllLogicConditions(),
    logicType: LogicType.ShowFields,
    show: [
      FIELD_TYPE_TO_ID[BasicField.Checkbox],
      FIELD_TYPE_TO_ID[BasicField.LongText],
      FIELD_TYPE_TO_ID[BasicField.Image],
      FIELD_TYPE_TO_ID[BasicField.Mobile],
      FIELD_TYPE_TO_ID[BasicField.Attachment],
    ],
  },
}

export const PreventSubmission = Template.bind({})
PreventSubmission.args = {
  _defaultValues: {
    logicType: LogicType.PreventSubmit,
    preventSubmitMessage:
      'No submission allowed because this is just a test block.',
  },
}

export const Mobile = Template.bind({})
Mobile.args = AllLogicConditions.args
Mobile.parameters = getMobileViewParameters()

// Helper functions to generate conditions
function generateAllLogicConditions(): FormCondition[] {
  const yesNoField = MAP_ID_TO_FIELD[
    FIELD_TYPE_TO_ID[BasicField.YesNo]
  ] as FormFieldWithId<YesNoFieldBase>
  const yesNoLogic = {
    field: yesNoField._id,
    state: LogicConditionState.Equal,
    value: 'Yes',
  }
  const numberField = MAP_ID_TO_FIELD[
    FIELD_TYPE_TO_ID[BasicField.Number]
  ] as FormFieldWithId<NumberFieldBase>
  const numberLogic = {
    field: numberField._id,
    state: LogicConditionState.Gte,
    value: '4',
  }
  const decimalField = MAP_ID_TO_FIELD[
    FIELD_TYPE_TO_ID[BasicField.Decimal]
  ] as FormFieldWithId<DecimalFieldBase>
  const decimalLogic = {
    field: decimalField._id,
    state: LogicConditionState.Lte,
    value: '4.5',
  }
  const dropdownField = MAP_ID_TO_FIELD[
    FIELD_TYPE_TO_ID[BasicField.Dropdown]
  ] as FormFieldWithId<DropdownFieldBase>
  const dropdownLogic = {
    field: dropdownField._id,
    state: LogicConditionState.Either,
    value: [dropdownField.fieldOptions[0], dropdownField.fieldOptions[1]],
  }
  const radioField = MAP_ID_TO_FIELD[
    FIELD_TYPE_TO_ID[BasicField.Radio]
  ] as FormFieldWithId<RadioFieldBase>
  const radioLogic = {
    field: radioField._id,
    state: LogicConditionState.Equal,
    value: radioField.fieldOptions[0],
  }
  const ratingField = MAP_ID_TO_FIELD[
    FIELD_TYPE_TO_ID[BasicField.Rating]
  ] as FormFieldWithId<RatingFieldBase>
  const ratingLogic = {
    field: ratingField._id,
    state: LogicConditionState.Gte,
    value: '4',
  }

  return [
    yesNoLogic,
    numberLogic,
    decimalLogic,
    dropdownLogic,
    radioLogic,
    ratingLogic,
  ]
}
