import { Box, useDisclosure } from '@chakra-ui/react'
import { DecoratorFn, Meta, Story } from '@storybook/react'

import { BasicField, HomenoFieldBase } from '~shared/types'

import { createFormBuilderMocks } from '~/mocks/msw/handlers/admin-form'

import { StoryRouter } from '~utils/storybook'

import { BuilderAndDesignContext } from '~features/admin-form/create/builder-and-design/BuilderAndDesignContext'
import { CreatePageSidebarProvider } from '~features/admin-form/create/common/CreatePageSidebarContext'

import { EditHomeno } from './EditHomeno'

const DEFAULT_HOMENO_FIELD: HomenoFieldBase = {
  title: 'Storybook Homeno',
  description: 'Some description about Homeno',
  required: true,
  disabled: false,
  fieldType: BasicField.HomeNo,
  allowIntlNumbers: false,
  globalId: 'unused',
}

const EditFieldDrawerDecorator: DecoratorFn = (storyFn) => {
  const deleteFieldModalDisclosure = useDisclosure()
  return (
    <Box maxW="33.25rem">
      <CreatePageSidebarProvider>
        <BuilderAndDesignContext.Provider
          value={{
            deleteFieldModalDisclosure,
          }}
        >
          {storyFn()}
        </BuilderAndDesignContext.Provider>
      </CreatePageSidebarProvider>
    </Box>
  )
}

export default {
  title: 'Features/AdminForm/EditFieldDrawer/EditHomeno',
  component: EditHomeno,
  decorators: [
    StoryRouter({
      initialEntries: ['/61540ece3d4a6e50ac0cc6ff'],
      path: '/:formId',
    }),
    EditFieldDrawerDecorator,
  ],
  parameters: {
    // Required so skeleton "animation" does not hide content.
    chromatic: { pauseAnimationAtEnd: true },
    msw: createFormBuilderMocks({}, 0),
  },
  args: {
    field: DEFAULT_HOMENO_FIELD,
  },
} as Meta<StoryArgs>

interface StoryArgs {
  field: HomenoFieldBase
}

const Template: Story<StoryArgs> = ({ field }) => {
  return <EditHomeno field={field} />
}

export const Default = Template.bind({})
Default.args = {
  field: DEFAULT_HOMENO_FIELD,
}

export const WithAllowIntlNums = Template.bind({})
WithAllowIntlNums.args = {
  field: {
    ...DEFAULT_HOMENO_FIELD,
    allowIntlNumbers: true,
  },
}
