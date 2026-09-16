import { useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { Text } from '@chakra-ui/react'
import { Meta, StoryFn } from '@storybook/react'
import { get, merge } from 'lodash'

import {
  BasicField,
  MyInfoChildAttributes,
  MyInfoChildData,
} from 'formsg-shared/types/field'

import Button from '~components/Button'

import { ChildrenCompoundFieldSchema } from '../types'

import {
  ChildrenCompoundField as ChildrenCompoundComponent,
  ChildrenCompoundFieldProps,
} from './ChildrenCompoundField'

export default {
  title: 'Templates/Field/ChildrenCompoundField',
  component: ChildrenCompoundComponent,
  decorators: [],
  parameters: {
    docs: {
      // Required in this story due to react-hook-form conflicting with
      // Storybook somehow.
      // See https://github.com/storybookjs/storybook/issues/12747.
      source: {
        type: 'code',
      },
    },
  },
} as Meta

const baseSchema: ChildrenCompoundFieldSchema = {
  childrenSubFields: [MyInfoChildAttributes.ChildName],
  allowMultiple: false,
  title: '',
  description: '',
  required: true,
  disabled: false,
  fieldType: BasicField.Children,
  _id: '611b94dfbb9e300012f702a7',
}

interface StoryChildrenCompoundFieldProps extends ChildrenCompoundFieldProps {
  childrenBirthRecords?: MyInfoChildData
  defaultValues?: Record<string, unknown>
}

const Template: StoryFn<StoryChildrenCompoundFieldProps> = ({
  childrenBirthRecords,
  defaultValues,
  ...args
}) => {
  const formMethods = useForm({ defaultValues })

  const [submitValues, setSubmitValues] = useState<string>()

  const onSubmit = (values: Record<string, unknown>) => {
    // Form values are nested under the field id (RHF nests on dots).
    setSubmitValues(
      JSON.stringify(get(values, `${args.schema._id}.child`)) ||
        'Nothing was selected',
    )
  }

  return (
    <FormProvider {...formMethods}>
      <form onSubmit={formMethods.handleSubmit(onSubmit)} noValidate>
        <ChildrenCompoundComponent
          myInfoChildrenBirthRecords={childrenBirthRecords}
          {...args}
        />
        <Button
          mt="1rem"
          type="submit"
          isLoading={formMethods.formState.isSubmitting}
          loadingText="Submitting"
        >
          Submit
        </Button>
        {submitValues && <Text>You have submitted: {submitValues}</Text>}
      </form>
    </FormProvider>
  )
}

export const SingleChild = Template.bind({})
SingleChild.args = {
  schema: baseSchema,
}

/** An existing form document whose stored allowMultiple flag is still `true`. */
export const LegacyAllowMultipleFlag = Template.bind({})
LegacyAllowMultipleFlag.args = {
  schema: merge({}, baseSchema, { allowMultiple: true }),
}

/**
 * MRF steps 2+: the step-1 answer is carried forward read-only. There is no
 * MyInfo session (myInfoChildrenBirthRecords is undefined), so the values come
 * solely from the previous step's response; nothing is editable and no blank
 * row is appended.
 */
export const DisabledCarriedForward = Template.bind({})
DisabledCarriedForward.args = {
  schema: merge({}, baseSchema, {
    disabled: true,
    childrenSubFields: [
      MyInfoChildAttributes.ChildName,
      MyInfoChildAttributes.ChildBirthCertNo,
    ],
  }),
  defaultValues: {
    [baseSchema._id]: {
      child: [['Phua Chu King', 'T1234567X']],
      childFields: [
        MyInfoChildAttributes.ChildName,
        MyInfoChildAttributes.ChildBirthCertNo,
      ],
    },
  },
}

/**
 * MRF steps 2+ where step 1 left the field unanswered: disabled with no
 * carried-forward value must not auto-append a blank editable row.
 */
export const DisabledUnanswered = Template.bind({})
DisabledUnanswered.args = {
  schema: merge({}, baseSchema, { disabled: true }),
}

/** An existing form that still lists secondary race in `childrenSubFields`. */
export const LegacySecondaryRaceSubField = Template.bind({})
LegacySecondaryRaceSubField.args = {
  schema: merge({}, baseSchema, {
    childrenSubFields: [
      MyInfoChildAttributes.ChildName,
      MyInfoChildAttributes.ChildRace,
      MyInfoChildAttributes.ChildSecondaryRace,
    ],
  }),
}
