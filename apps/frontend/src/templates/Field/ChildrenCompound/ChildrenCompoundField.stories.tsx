import { useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { Text } from '@chakra-ui/react'
import { Meta, StoryFn } from '@storybook/react'
import { merge } from 'lodash'

import {
  BasicField,
  ChildrenFieldVersion,
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
  childrenBirthRecords: MyInfoChildData
}

const Template: StoryFn<StoryChildrenCompoundFieldProps> = ({
  childrenBirthRecords,
  ...args
}) => {
  const formMethods = useForm()

  const [submitValues, setSubmitValues] = useState<string>()

  const onSubmit = (values: Record<string, string | undefined>) => {
    setSubmitValues(
      JSON.stringify(values[`${args.schema._id}.child`]) ||
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

export const AllowMultipleChildren = Template.bind({})
AllowMultipleChildren.args = {
  schema: merge({}, baseSchema, { allowMultiple: true }),
}

// children-v2 (ADR-0001): a single local child, common-denominator sub-fields,
// no add-multiple affordance, Secondary Race omitted.
const childrenV2BirthRecords: MyInfoChildData = {
  [MyInfoChildAttributes.ChildName]: ['Tan Wen Jie'],
  [MyInfoChildAttributes.ChildBirthCertNo]: ['S1234567A'],
  [MyInfoChildAttributes.ChildGender]: ['MALE'],
  [MyInfoChildAttributes.ChildRace]: ['CHINESE'],
}

export const ChildrenV2SingleLocalChild = Template.bind({})
ChildrenV2SingleLocalChild.args = {
  schema: merge({}, baseSchema, {
    version: ChildrenFieldVersion.V2,
    allowMultiple: false,
    childrenSubFields: [
      MyInfoChildAttributes.ChildName,
      MyInfoChildAttributes.ChildBirthCertNo,
      MyInfoChildAttributes.ChildGender,
      MyInfoChildAttributes.ChildRace,
    ],
  }),
  childrenBirthRecords: childrenV2BirthRecords,
}
