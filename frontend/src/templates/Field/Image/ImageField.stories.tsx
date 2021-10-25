import { Meta, Story } from '@storybook/react'
import { merge } from 'lodash'

import { BasicField } from '~shared/types/field'

import MockImage from './mocks/img-login.svg'
import {
  ImageField as ImageFieldComponent,
  ImageFieldProps,
  ImageFieldSchema,
} from './ImageField'

export default {
  title: 'Templates/Field/ImageField',
  component: ImageFieldComponent,
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

const baseSchema: ImageFieldSchema = {
  title: 'Some image title',
  description:
    'SVG of our landing page image. See more at [Form](https://form.gov.sg)',
  required: true,
  disabled: false,
  fieldType: BasicField.Image,
  _id: '611b94dfbb9e300012f702a7',
  fileMd5Hash: 'some hash',
  name: 'some name',
  size: '12345',
  url: MockImage,
}

interface StoryImageFieldProps extends ImageFieldProps {
  defaultValue?: string
}

const Template: Story<StoryImageFieldProps> = ({ defaultValue, ...args }) => {
  return <ImageFieldComponent {...args} />
}

export const Default = Template.bind({})
Default.args = {
  schema: baseSchema,
}

export const Loading = Template.bind({})
Loading.args = {
  schema: merge({}, baseSchema, { url: 'some-invalid-url' }),
}
