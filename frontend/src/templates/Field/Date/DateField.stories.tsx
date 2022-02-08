import { useEffect, useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { Text } from '@chakra-ui/react'
import { Meta, Story } from '@storybook/react'

import { BasicField, DateSelectedValidation } from '~shared/types/field'

import { mockDateDecorator } from '~utils/storybook'
import Button from '~components/Button'

import {
  DateField as DateFieldComponent,
  DateFieldProps,
  DateFieldSchema,
} from './DateField'

const MOCKED_TODAY_DATE = '2021-12-13'

export default {
  title: 'Templates/Field/DateField',
  component: DateFieldComponent,
  decorators: [mockDateDecorator],
  parameters: {
    // Exported for testing
    test: {
      MOCKED_TODAY_DATE,
    },
    mockdate: new Date(MOCKED_TODAY_DATE),
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

const baseSchema: DateFieldSchema = {
  dateValidation: {
    customMaxDate: null,
    customMinDate: null,
    selectedDateValidation: null,
  },
  title: 'Date field snapshot',
  description: '',
  required: true,
  disabled: false,
  fieldType: BasicField.Date,
  _id: '611b94dfbb9e300012f702a7',
}

interface StoryDateFieldProps extends DateFieldProps {
  defaultValue?: string
}

const Template: Story<StoryDateFieldProps> = ({ defaultValue, ...args }) => {
  const formMethods = useForm({
    defaultValues: {
      [args.schema._id]: defaultValue,
    },
  })

  const [submitValues, setSubmitValues] = useState<string>()

  const onSubmit = (values: Record<string, string>) => {
    setSubmitValues(values[args.schema._id] || 'Nothing was selected')
  }

  useEffect(() => {
    if (defaultValue) {
      formMethods.trigger()
    }
  }, [])

  return (
    <FormProvider {...formMethods}>
      <form onSubmit={formMethods.handleSubmit(onSubmit)} noValidate>
        <DateFieldComponent {...args} />
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
}

export const ValidationOptional = Template.bind({})
ValidationOptional.args = {
  schema: {
    ...baseSchema,
    required: false,
    description: 'Date field is optional',
  },
}

export const ValidationNoFuture = Template.bind({})
ValidationNoFuture.args = {
  schema: {
    ...baseSchema,
    description: 'Future dates are disallowed',
    dateValidation: {
      customMaxDate: null,
      customMinDate: null,
      selectedDateValidation: DateSelectedValidation.NoFuture,
    },
  },
}

export const ValidationNoPast = Template.bind({})
ValidationNoPast.args = {
  schema: {
    ...baseSchema,
    description: 'Past dates are disallowed',
    dateValidation: {
      customMaxDate: null,
      customMinDate: null,
      selectedDateValidation: DateSelectedValidation.NoPast,
    },
  },
}

export const ValidationCustomRange = Template.bind({})
ValidationCustomRange.args = {
  schema: {
    ...baseSchema,
    description: 'Only 12 December to 25 December 2021 is allowed',
    dateValidation: {
      customMaxDate: new Date('2021-12-25'),
      customMinDate: new Date('2021-12-12'),
      selectedDateValidation: DateSelectedValidation.Custom,
    },
  },
}
