import { Box } from '@chakra-ui/react'
import { Meta, StoryFn } from '@storybook/react'

import { BasicField } from '~shared/types/field'

import { viewports } from '~utils/storybook'

import { ParagraphFieldSchema } from '../types'

import {
  ParagraphField as ParagraphFieldComponent,
  ParagraphFieldProps,
} from './ParagraphField'

export default {
  title: 'Templates/Field/ParagraphField',
  component: ParagraphFieldComponent,
  // Prevents chromatic from cutting the story off due to <li/> margins.
  decorators: [(storyFn) => <Box>{storyFn()}</Box>],
} as Meta

const baseSchema: ParagraphFieldSchema = {
  title: 'Actually hidden',
  description: `1. This form allows companies to apply for crew changes under various circumstances. Please refer to Port Marine Circular No.s 26, 27 and 38 of 2020 for more details.
  2. All crew change applications must be submitted to MPA at least 14 days in advance of the planned crew change.
  
  3. Please make separate applications for off-signers and on-signers. You will have to make more than one application if you have more than 20 off-signers and/or on-signers.`,
  required: true,
  disabled: false,
  fieldType: BasicField.Statement,
  _id: '611b94dfbb9e300012f702a7',
}

interface StoryParagraphFieldProps extends ParagraphFieldProps {
  defaultValue?: string
}

const Template: StoryFn<StoryParagraphFieldProps> = (args) => (
  <ParagraphFieldComponent {...args} />
)

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
