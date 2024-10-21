import { Box } from '@chakra-ui/react'
import { Meta, StoryFn } from '@storybook/react'

import { AdminFormDto, FormResponseMode } from '~shared/types'

import { createFormBuilderMocks } from '~/mocks/msw/handlers/admin-form'

import { StoryRouter } from '~utils/storybook'

import { EmptyFormPlaceholder } from './EmptyFormPlaceholder'

const buildMswRoutes = (
  overrides?: Partial<AdminFormDto>,
  delay: number | 'infinite' = 0,
) => createFormBuilderMocks(overrides, delay)

export default {
  title: 'Features/AdminForm/EmptyFormPlaceholder',
  component: EmptyFormPlaceholder,
  decorators: [StoryRouter({ initialEntries: ['/12345'], path: '/:formId' })],
  parameters: {
    msw: buildMswRoutes({
      responseMode: FormResponseMode.Encrypt,
    }),
  },
} as Meta

const Template: StoryFn = (args) => {
  return (
    <Box p="2rem">
      <EmptyFormPlaceholder
        {...args}
        isDraggingOver={false}
        onClick={() => {}}
        onMagicFormButtonClick={() => {}}
      />
    </Box>
  )
}

export const StorageMode = Template.bind({})
StorageMode.args = {
  isDraggingOver: false,
  onClick: () => console.log('Placeholder clicked'),
  onMagicFormButtonClick: () => console.log('Magic form button clicked'),
}
