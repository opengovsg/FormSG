import { Box, useDisclosure } from '@chakra-ui/react'
import { DecoratorFn, Meta, Story } from '@storybook/react'

import {
  BasicField,
  NumberFieldBase,
  NumberSelectedValidation,
} from '~shared/types'

import { StoryRouter } from '~utils/storybook'

import { BuilderAndDesignContext } from '~features/admin-form/create/builder-and-design/BuilderAndDesignContext'
import { CreatePageSidebarProvider } from '~features/admin-form/create/common/CreatePageSidebarContext'

import { EditNumber } from './EditNumber'

const DEFAULT_NUMBER_FIELD: NumberFieldBase = {
  title: 'Storybook Number',
  description: 'Some description',
  ValidationOptions: {
    customVal: null,
    selectedValidation: null,
  },
  required: true,
  disabled: false,
  fieldType: BasicField.Number,
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
  title: 'Features/AdminForm/EditFieldDrawer/EditNumber',
  component: EditNumber,
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
  field: NumberFieldBase
}

const Template: Story<StoryArgs> = ({ field }) => {
  return <EditNumber field={field} />
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
      selectedValidation: NumberSelectedValidation.Exact,
    },
  },
}
