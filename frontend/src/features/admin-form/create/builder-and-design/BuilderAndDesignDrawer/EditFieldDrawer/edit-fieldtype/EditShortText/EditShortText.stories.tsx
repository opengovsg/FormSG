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

import { EditShortText, EditShortTextProps } from './EditShortText'

const DEFAULT_SHORTTEXT_FIELD: ShortTextFieldBase = {
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
    field: DEFAULT_SHORTTEXT_FIELD,
  },
} as Meta<EditShortTextProps>

const Template: Story<EditShortTextProps> = ({ field }) => {
  return <EditShortText field={field} />
}

export const Default = Template.bind({})

export const WithCustomVal = Template.bind({})
WithCustomVal.args = {
  field: {
    ...DEFAULT_SHORTTEXT_FIELD,
    ValidationOptions: {
      customVal: 3,
      selectedValidation: TextSelectedValidation.Maximum,
    },
  },
}

export const PrefillNoFieldId = Template.bind({})
PrefillNoFieldId.args = {
  field: {
    ...DEFAULT_SHORTTEXT_FIELD,
    allowPrefill: true,
  },
}

export const PrefillWithFieldId = Template.bind({})
PrefillWithFieldId.args = {
  field: {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    ...PrefillNoFieldId.args.field!,
    _id: 'mock-field-id-allow-copy',
  },
}
