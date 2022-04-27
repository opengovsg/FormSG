import { Box, useDisclosure } from '@chakra-ui/react'
import { DecoratorFn, Meta, Story } from '@storybook/react'

import {
  BasicField,
  LongTextFieldBase,
  TextSelectedValidation,
} from '~shared/types'

import { StoryRouter } from '~utils/storybook'

import { BuilderAndDesignContext } from '~features/admin-form/create/builder-and-design/BuilderAndDesignContext'
import { CreatePageSidebarProvider } from '~features/admin-form/create/common/CreatePageSidebarContext'

import { EditLongText, EditLongTextProps } from './EditLongText'

const DEFAULT_LONGTEXT_FIELD: LongTextFieldBase = {
  title: 'Storybook LongText',
  description: 'Some description',
  ValidationOptions: {
    customVal: null,
    selectedValidation: null,
  },
  required: true,
  disabled: false,
  fieldType: BasicField.LongText,
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
  title: 'Features/AdminForm/EditFieldDrawer/EditLongText',
  component: EditLongText,
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
    field: DEFAULT_LONGTEXT_FIELD,
  },
} as Meta<EditLongTextProps>

const Template: Story<EditLongTextProps> = ({ field }) => {
  return <EditLongText field={field} />
}

export const Default = Template.bind({})

export const WithCustomVal = Template.bind({})
WithCustomVal.args = {
  field: {
    ...DEFAULT_LONGTEXT_FIELD,
    ValidationOptions: {
      customVal: 3,
      selectedValidation: TextSelectedValidation.Maximum,
    },
  },
}
