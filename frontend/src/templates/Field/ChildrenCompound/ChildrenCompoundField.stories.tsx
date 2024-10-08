import { useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { Text } from '@chakra-ui/react'
import { Meta, StoryFn } from '@storybook/react'
import { merge } from 'lodash'

import {
  BasicField,
  MyInfoChildAttributes,
  MyInfoChildData,
} from '~shared/types/field'

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
