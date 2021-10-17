import { useEffect, useMemo, useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { Text } from '@chakra-ui/react'
import { Meta, Story } from '@storybook/react'
import { times } from 'lodash'

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
  defaultValue?: Record<string, string>
}

const Template: Story<StoryTableFieldProps> = ({ defaultValue, ...args }) => {
  const baseRowData = useMemo(
    () =>
      args.schema.columns.reduce((acc, c) => {
        acc[c._id] = ''
        return acc
      }, {} as Record<string, unknown>),
    [args.schema.columns],
  )

  const data = useMemo(() => {
    return times(args.schema.minimumRows, () => baseRowData)
  }, [baseRowData, args.schema.minimumRows])

  const formMethods = useForm({
    defaultValues: {
      [args.schema._id]: data,
    },
  })

  const [submitValues, setSubmitValues] = useState<string>()

  useEffect(() => {
    if (defaultValue) {
      formMethods.trigger()
    }
  }, [])

  const onSubmit = (values: Record<string, string>) => {
    console.log(values)
    setSubmitValues(
      JSON.stringify(values[args.schema._id]) || 'Nothing was selected',
    )
  }

  return (
    <FormProvider {...formMethods}>
      <form noValidate onSubmit={formMethods.handleSubmit(onSubmit)}>
        <TableFieldComponent {...args} />
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

export const Default = Template.bind({})
Default.args = {
  schema: baseSchema,
}

export const ValidationEmpty = Template.bind({})
ValidationEmpty.args = {
  schema: baseSchema,
  defaultValue: baseSchema.columns.reduce((acc, c) => {
    acc[c._id] = ''
    return acc
  }, {} as Record<string, string>),
}
