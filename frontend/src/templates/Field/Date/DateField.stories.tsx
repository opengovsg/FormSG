import { useEffect, useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { Text } from '@chakra-ui/react'
import { Meta, Story } from '@storybook/react'
import { addDays, lightFormat, parse } from 'date-fns'

import { BasicField, DateSelectedValidation } from '~shared/types/field'

import { mockDateDecorator } from '~utils/storybook'
import Button from '~components/Button'

import { DateFieldSchema } from '../types'

import {
  DATE_DISPLAY_FORMAT,
  DateField as DateFieldComponent,
  DateFieldProps,
} from './DateField'

const MOCKED_TODAY_DATE_STRING = '13/12/2021'
const MOCKED_TODAY_DATE = parse(
  MOCKED_TODAY_DATE_STRING,
  DATE_DISPLAY_FORMAT,
  new Date(),
)

export default {
  title: 'Templates/Field/DateField',
  component: DateFieldComponent,
  decorators: [mockDateDecorator],
  parameters: {
    // Exported for testing
    test: {
      MOCKED_TODAY_DATE_STRING,
      MOCKED_TODAY_DATE,
    },
    mockdate: MOCKED_TODAY_DATE,
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

  const onSubmit = (values: Record<string, string | undefined>) => {
    setSubmitValues(values[args.schema._id] || 'Nothing was selected')
  }

  useEffect(() => {
    if (defaultValue !== undefined) {
      formMethods.trigger()
    }
  }, [defaultValue, formMethods])

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
  defaultValue: '',
}

export const ValidationOptional = Template.bind({})
ValidationOptional.args = {
  schema: {
    ...baseSchema,
    required: false,
    description: 'Date field is optional',
  },
  defaultValue: '',
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
  defaultValue: lightFormat(
    addDays(MOCKED_TODAY_DATE, 10),
    DATE_DISPLAY_FORMAT,
  ),
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
  defaultValue: lightFormat(
    addDays(MOCKED_TODAY_DATE, -10),
    DATE_DISPLAY_FORMAT,
  ),
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
  defaultValue: '26/12/2021',
}
