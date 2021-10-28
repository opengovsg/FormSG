import { useEffect, useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { Text } from '@chakra-ui/react'
import { Meta, Story } from '@storybook/react'
import { merge } from 'lodash'

import { BasicField, RatingShape } from '~shared/types/field'

import Button from '~components/Button'

import {
  RatingField as RatingFieldComponent,
  RatingFieldProps,
  RatingFieldSchema,
} from './RatingField'

export default {
  title: 'Templates/Field/RatingField',
  component: RatingFieldComponent,
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

const requiredSchema: RatingFieldSchema = {
  title: 'Rate this component',
  description: '1: Bad, 10: Good',
  required: true,
  disabled: false,
  fieldType: BasicField.Rating,
  ratingOptions: {
    steps: 10,
    shape: RatingShape.Star,
  },
  _id: '611b94dfbb9e300012f702a7',
}

const Template: Story<RatingFieldProps> = (args) => {
  const formMethods = useForm()

  const [submitValues, setSubmitValues] = useState<string>()

  const onSubmit = (values: Record<string, string>) => {
    setSubmitValues(values[args.schema._id] ?? 'Nothing was selected')
  }

  useEffect(() => {
    formMethods.trigger()
  }, [])

  return (
    <FormProvider {...formMethods}>
      <form onSubmit={formMethods.handleSubmit(onSubmit)} noValidate>
        <RatingFieldComponent {...args} />
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
  schema: requiredSchema,
}

export const ValidationOptional = Template.bind({})
ValidationOptional.args = {
  schema: { ...requiredSchema, required: false },
}

export const RatingFieldHeart = Template.bind({})
RatingFieldHeart.args = {
  schema: merge({}, requiredSchema, {
    required: false,
    ratingOptions: {
      shape: RatingShape.Heart,
      steps: 6,
    },
  }),
}
