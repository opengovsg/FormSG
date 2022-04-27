import { Box, useDisclosure } from '@chakra-ui/react'
import { DecoratorFn, Meta, Story } from '@storybook/react'

import { BasicField, DecimalFieldBase } from '~shared/types'

import { StoryRouter } from '~utils/storybook'

import { BuilderAndDesignContext } from '~features/admin-form/create/builder-and-design/BuilderAndDesignContext'
import { getFieldCreationMeta } from '~features/admin-form/create/builder-and-design/utils/fieldCreation'
import { CreatePageSidebarProvider } from '~features/admin-form/create/common/CreatePageSidebarContext'

import { EditDecimal } from './EditDecimal'

const DEFAULT_DECIMAL_FIELD = getFieldCreationMeta(
  BasicField.Decimal,
) as DecimalFieldBase

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
  title: 'Features/AdminForm/EditFieldDrawer/EditDecimal',
  component: EditDecimal,
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
    field: DEFAULT_DECIMAL_FIELD,
  },
} as Meta<StoryArgs>

interface StoryArgs {
  field: DecimalFieldBase
}

const Template: Story<StoryArgs> = ({ field }) => {
  return <EditDecimal field={field} />
}

export const Default = Template.bind({})
Default.args = {
  field: DEFAULT_DECIMAL_FIELD,
}

export const WithNumberValidation = Template.bind({})
WithNumberValidation.args = {
  field: {
    ...DEFAULT_DECIMAL_FIELD,
    validateByValue: true,
    ValidationOptions: {
      customMin: 3,
      customMax: null,
    },
  },
}
