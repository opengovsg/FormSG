import { useMemo, useRef } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
import { Meta, Story } from '@storybook/react'
import { merge, pickBy } from 'lodash'
import { PartialDeep } from 'type-fest'

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

import { MOCK_FORM_FIELDS } from '~/mocks/msw/handlers/admin-form'

import { getMobileViewParameters } from '~utils/storybook'

import { ALLOWED_LOGIC_FIELDS } from '../../../constants'
import { EditLogicInputs, FormFieldWithQuestionNumber } from '../../../types'

import { NewLogicBlock, NewLogicBlockProps } from './NewLogicBlock'

export default {
  title: 'Templates/Logic/NewLogicBlock',
  component: NewLogicBlock,
  decorators: [],
} as Meta

interface TemplateStoryProps {
  defaultValues?: PartialDeep<EditLogicInputs>
}

const MAP_ID_TO_FIELD = MOCK_FORM_FIELDS.reduce((acc, field, index) => {
  acc[field._id] = { ...field, questionNumber: index + 1 }
  return acc
}, {} as Record<string, FormFieldWithQuestionNumber>)
const FIELD_TYPE_TO_ID = MOCK_FORM_FIELDS.reduce((acc, field) => {
  acc[field.fieldType] = field._id
  return acc
}, {} as Record<BasicField, string>)
const LOGICABLE_FIELDS = pickBy(MAP_ID_TO_FIELD, (f) =>
  ALLOWED_LOGIC_FIELDS.has(f.fieldType),
)

const Template: Story<TemplateStoryProps> = ({ defaultValues }) => {
  const useMockHook: NewLogicBlockProps['useNewLogicBlock'] = () => {
    const formMethods = useForm<EditLogicInputs>({
      defaultValues: merge({ conditions: [{}] }, defaultValues),
    })

    const {
      fields: logicConditionBlocks,
      append,
      remove,
    } = useFieldArray({
      control: formMethods.control,
      name: 'conditions',
    })
    const wrapperRef = useRef<HTMLDivElement | null>(null)

    // Only allow logic removal if there is more than one logic block.
    const handleRemoveLogic = useMemo(
      () => (logicConditionBlocks.length > 1 ? remove : undefined),
      [logicConditionBlocks.length, remove],
    )

    return {
      formFields: MOCK_FORM_FIELDS,
      formMethods,
      handleAddCondition: () => append({}),
      handleCreateLogic: formMethods.handleSubmit((input) =>
        console.log(input),
      ),
      handleRemoveLogic,
      logicConditionBlocks,
      isLoading: false,
      logicableFields: LOGICABLE_FIELDS,
      mapIdToField: MAP_ID_TO_FIELD,
      setToInactive: () => console.log('setting to inactive'),
      wrapperRef,
    }
  }
  return <NewLogicBlock useNewLogicBlock={useMockHook} />
}
export const Default = Template.bind({})

export const AllLogicConditions = Template.bind({})
AllLogicConditions.args = {
  defaultValues: {
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
  defaultValues: {
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
