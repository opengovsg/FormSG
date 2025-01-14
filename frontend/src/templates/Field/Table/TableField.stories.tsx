import { useEffect, useMemo, useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { Text } from '@chakra-ui/react'
import { Meta, StoryFn } from '@storybook/react'
import { assign, merge, times } from 'lodash'

import { BasicField } from '~shared/types/field'

import { viewports } from '~utils/storybook'
import Button from '~components/Button'

import { TableFieldSchema } from '../types'

import {
  TableField as TableFieldComponent,
  TableFieldProps,
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

const STORYBOOK_DROPDOWN_OPTIONS = ['Eraser', 'Pencil', 'Pen', 'Book']

const baseSchema: TableFieldSchema = {
  addMoreRows: true,
  title: 'Table',
  description: '',
  required: true,
  disabled: false,
  fieldType: BasicField.Table,
  _id: '616b055a6b1c3400122f469d',
  minimumRows: 3,
  columns: [
    {
      ValidationOptions: {
        customVal: null,
        selectedValidation: null,
      },
      allowPrefill: false,
      _id: '616b055a6b1c3400122f469f',
      columnType: BasicField.ShortText,
      title: 'Job title',
      required: true,
    },
    {
      ValidationOptions: {
        customVal: null,
        selectedValidation: null,
      },
      allowPrefill: false,
      _id: '616b055a6b1c3400122f46a1',
      columnType: BasicField.ShortText,
      title: 'Job description',
      required: false,
    },
    {
      fieldOptions: STORYBOOK_DROPDOWN_OPTIONS,
      _id: '616b055a6b1c3400122f46a2',
      columnType: BasicField.Dropdown,
      title: 'Field of employment',
      required: true,
    },
    {
      ValidationOptions: {
        customVal: null,
        selectedValidation: null,
      },
      allowPrefill: false,
      _id: '616b055a6b1c3400122f46a9',
      columnType: BasicField.ShortText,
      title: 'Job description 2',
      required: true,
    },
    {
      ValidationOptions: {
        customVal: null,
        selectedValidation: null,
      },
      allowPrefill: false,
      _id: '616b055a6b1c3400122f46b9',
      columnType: BasicField.ShortText,
      title: 'Job description longer column title name',
      required: false,
    },
  ],
  maximumRows: 5,
}

interface StoryTableFieldProps extends TableFieldProps {
  defaultValue?: Record<string, string>
  triggerValidation?: boolean
}

const Template: StoryFn<StoryTableFieldProps> = ({
  defaultValue,
  triggerValidation,
  ...args
}) => {
  const baseRowData = useMemo(
    () =>
      args.schema.columns.reduce<Record<string, string>>((acc, c) => {
        acc[c._id] = ''
        return acc
      }, {}),
    [args.schema.columns],
  )

  const data = useMemo(() => {
    return times(
      args.schema.minimumRows || 0,
      () => defaultValue ?? baseRowData,
    )
  }, [args.schema.minimumRows, defaultValue, baseRowData])

  const formMethods = useForm({
    defaultValues: {
      [args.schema._id]: data,
    },
  })

  const [submitValues, setSubmitValues] = useState<string>()

  useEffect(() => {
    if (triggerValidation) {
      formMethods.trigger()
    }
  }, [defaultValue, formMethods, triggerValidation])

  const onSubmit = (values: Record<string, Record<string, string>[]>) => {
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

export const Mobile = Template.bind({})
Mobile.args = {
  schema: baseSchema,
}
Mobile.parameters = {
  viewport: {
    defaultViewport: 'mobile1',
  },
  chromatic: { viewports: [viewports.xs] },
}

export const NoAddableRows = Template.bind({})
NoAddableRows.args = {
  schema: merge({}, baseSchema, { addMoreRows: false }),
}

export const ThreeColumnTable = Template.bind({})
ThreeColumnTable.args = {
  schema: assign({}, baseSchema, { columns: baseSchema.columns.slice(0, 3) }),
}

export const ValidationEmpty = Template.bind({})
ValidationEmpty.args = {
  schema: baseSchema,
  triggerValidation: true,
}

export const ValidationValid = Template.bind({})
ValidationValid.args = {
  schema: baseSchema,
  triggerValidation: true,
  defaultValue: baseSchema.columns.reduce<Record<string, string>>((acc, c) => {
    if (c.columnType === BasicField.ShortText) {
      acc[c._id] = 'This is a valid value'
    } else if (c.columnType === BasicField.Dropdown) {
      acc[c._id] = STORYBOOK_DROPDOWN_OPTIONS[1]
    }
    return acc
  }, {}),
}
