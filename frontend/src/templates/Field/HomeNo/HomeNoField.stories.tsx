import { useEffect, useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { Text } from '@chakra-ui/react'
import { Meta, StoryFn } from '@storybook/react'

import { BasicField } from '~shared/types/field'

import Button from '~components/Button'

import { HomeNoFieldSchema } from '../types'

import {
  HomeNoField as HomeNoFieldComponent,
  HomeNoFieldProps,
} from './HomeNoField'

export default {
  title: 'Templates/Field/HomeNoField',
  component: HomeNoFieldComponent,
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

const baseSchema: HomeNoFieldSchema = {
  title: 'Your home number',
  description: 'No spam calls. Promise.',
  required: true,
  disabled: false,
  fieldType: BasicField.HomeNo,
  allowIntlNumbers: false,
  _id: '611b94dfbb9e300012f702a7',
}

interface StoryHomeNoFieldProps extends HomeNoFieldProps {
  defaultValue?: string
}

const Template: StoryFn<StoryHomeNoFieldProps> = ({
  defaultValue,
  ...args
}) => {
  const formMethods = useForm({
    defaultValues: {
      [args.schema._id]: defaultValue,
    },
  })

  const [submitValues, setSubmitValues] = useState<string>()

  const onSubmit = (values: Record<string, string | undefined>) => {
    setSubmitValues(values[args.schema._id] || 'Nothing was selected')
  }

  useEffect(() => {
    if (defaultValue !== undefined) {
      formMethods.trigger()
    }
    // Only want it to run once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <FormProvider {...formMethods}>
      <form onSubmit={formMethods.handleSubmit(onSubmit)} noValidate>
        <HomeNoFieldComponent {...args} />
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

export const ValidationRequired = Template.bind({})
ValidationRequired.args = {
  schema: baseSchema,
  defaultValue: '',
}

export const ValidationOptional = Template.bind({})
ValidationOptional.args = {
  schema: { ...baseSchema, required: false },
}

export const ValidationInvalidLandline = Template.bind({})
ValidationInvalidLandline.args = {
  schema: baseSchema,
  defaultValue: '98765432',
}

export const ValidationValidLandline = Template.bind({})
ValidationValidLandline.args = {
  schema: baseSchema,
  defaultValue: '61234567',
}
