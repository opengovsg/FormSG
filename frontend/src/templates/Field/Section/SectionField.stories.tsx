import { Meta, Story } from '@storybook/react'

import { BasicField } from '~shared/types/field'

import {
  SectionField as SectionFieldComponent,
  SectionFieldProps,
} from './SectionField'
import { SectionFieldSchema } from './SectionFieldContainer'

export default {
  title: 'Templates/Field/SectionField',
  component: SectionFieldComponent,
  decorators: [],
  parameters: {},
} as Meta

const baseSchema: SectionFieldSchema = {
  title: 'This is a new header',
  description: 'Lorem ipsum some optional section description',
  required: true,
  disabled: false,
  fieldType: BasicField.Section,
  _id: '611b94dfbb9e300012f702a7',
}

interface StorySectionFieldProps extends SectionFieldProps {
  defaultValue?: string
}

const Template: Story<StorySectionFieldProps> = ({ defaultValue, ...args }) => {
  return <SectionFieldComponent {...args} />
}

export const Default = Template.bind({})
Default.args = {
  schema: baseSchema,
}

export const WithoutDescription = Template.bind({})
WithoutDescription.args = {
  schema: { ...baseSchema, description: '' },
}
