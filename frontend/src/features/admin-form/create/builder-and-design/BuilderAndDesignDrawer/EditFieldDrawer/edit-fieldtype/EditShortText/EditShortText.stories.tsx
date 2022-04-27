import { Box, useDisclosure } from '@chakra-ui/react'
import { DecoratorFn, Meta, Story } from '@storybook/react'

import {
  BasicField,
  ShortTextFieldBase,
  TextSelectedValidation,
} from '~shared/types'

import { StoryRouter } from '~utils/storybook'

import { BuilderAndDesignContext } from '~features/admin-form/create/builder-and-design/BuilderAndDesignContext'
import { CreatePageSidebarProvider } from '~features/admin-form/create/common/CreatePageSidebarContext'

import { EditShortText } from './EditShortText'

const DEFAULT_NUMBER_FIELD: ShortTextFieldBase = {
  title: 'Storybook ShortText',
  description: 'Some description',
  ValidationOptions: {
    customVal: null,
    selectedValidation: null,
  },
  required: true,
  disabled: false,
  fieldType: BasicField.ShortText,
  globalId: 'unused',
}

const EditFieldDrawerDecorator: DecoratorFn = (storyFn) => {
  const mobileCreateEditModalDisclosure = useDisclosure()
  const deleteFieldModalDisclosure = useDisclosure()
  return (
    <Box maxW="33.25rem">
      <CreatePageSidebarProvider>
        <BuilderAndDesignContext.Provider
          value={{
            mobileCreateEditModalDisclosure,
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
  title: 'Features/AdminForm/EditFieldDrawer/EditShortText',
  component: EditShortText,
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
  },
  args: {
    field: DEFAULT_NUMBER_FIELD,
  },
} as Meta<StoryArgs>

interface StoryArgs {
  field: ShortTextFieldBase
}

const Template: Story<StoryArgs> = ({ field }) => {
  return <EditShortText field={field} />
}

export const Default = Template.bind({})
Default.args = {
  field: DEFAULT_NUMBER_FIELD,
}

export const WithCustomVal = Template.bind({})
WithCustomVal.args = {
  field: {
    ...DEFAULT_NUMBER_FIELD,
    ValidationOptions: {
      customVal: 3,
      selectedValidation: TextSelectedValidation.Maximum,
    },
  },
}
