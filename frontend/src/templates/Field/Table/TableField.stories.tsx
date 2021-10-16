/* eslint-disable @typescript-eslint/no-unused-vars */
import { useEffect, useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { Text } from '@chakra-ui/react'
import { Meta, Story } from '@storybook/react'

import { BasicField } from '~shared/types/field'

import Button from '~components/Button'

import mockData from './data.json'
import {
  TableField as TableFieldComponent,
  TableFieldProps,
  TableFieldSchema,
} from './TableField'

export default {
  title: 'Templates/Field/TableField',
  component: TableFieldComponent,
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

const baseSchema: TableFieldSchema = mockData as TableFieldSchema

interface StoryTableFieldProps extends TableFieldProps {
  defaultValue?: string
}

const Template: Story<StoryTableFieldProps> = ({ defaultValue, ...args }) => {
  const formMethods = useForm({
    defaultValues: {
      // [args.schema._id]: [[], [], []],
    },
  })

  const [submitValues, setSubmitValues] = useState<string>()

  const onSubmit = (values: Record<string, string>) => {
    setSubmitValues(
      JSON.stringify(values[args.schema._id]) || 'Nothing was selected',
    )
  }

  useEffect(() => {
    if (defaultValue) {
      formMethods.trigger()
    }
  }, [])

  return (
    // <FormProvider {...formMethods}>
    //   <form onSubmit={formMethods.handleSubmit(onSubmit)} noValidate>
    <TableFieldComponent {...args} />
    //     <Button
    //       mt="1rem"
    //       type="submit"
    //       isLoading={formMethods.formState.isSubmitting}
    //       loadingText="Submitting"
    //     >
    //       Submit
    //     </Button>
    //     {submitValues && <Text>You have submitted: {submitValues}</Text>}
    //   </form>
    // </FormProvider>
  )
}

export const ValidationRequired = Template.bind({})
ValidationRequired.args = {
  schema: baseSchema,
}

export const ValidationOptional = Template.bind({})
ValidationOptional.args = {
  schema: { ...baseSchema, required: false },
}
