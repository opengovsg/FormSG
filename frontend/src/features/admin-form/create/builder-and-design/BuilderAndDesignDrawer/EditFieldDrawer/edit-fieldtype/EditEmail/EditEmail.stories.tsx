import { Box, useDisclosure } from '@chakra-ui/react'
import { DecoratorFn, Meta, Story } from '@storybook/react'

import { BasicField, EmailFieldBase } from '~shared/types'

import { createFormBuilderMocks } from '~/mocks/msw/handlers/admin-form'

import { StoryRouter } from '~utils/storybook'

import { BuilderAndDesignContext } from '~features/admin-form/create/builder-and-design/BuilderAndDesignContext'
import { CreatePageSidebarProvider } from '~features/admin-form/create/common/CreatePageSidebarContext'

import { EditEmail } from './EditEmail'

const DEFAULT_EMAIL_FIELD: EmailFieldBase = {
  title: 'Storybook Email',
  description: 'Some description about email',
  required: true,
  disabled: false,
  allowedEmailDomains: [],
  autoReplyOptions: {
    hasAutoReply: false,
    autoReplySubject: '',
    autoReplySender: '',
    autoReplyMessage: '',
    includeFormSummary: false,
  },
  hasAllowedEmailDomains: false,
  isVerifiable: false,
  fieldType: BasicField.Email,
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
  title: 'Features/AdminForm/EditFieldDrawer/EditEmail',
  component: EditEmail,
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
    field: DEFAULT_EMAIL_FIELD,
  },
} as Meta<StoryArgs>

interface StoryArgs {
  field: EmailFieldBase
}

const Template: Story<StoryArgs> = ({ field }) => {
  return <EditEmail field={field} />
}

export const Default = Template.bind({})
Default.args = {
  field: DEFAULT_EMAIL_FIELD,
}

export const WithDomainRestriction = Template.bind({})
WithDomainRestriction.args = {
  field: {
    ...DEFAULT_EMAIL_FIELD,
    isVerifiable: true,
    hasAllowedEmailDomains: true,
    allowedEmailDomains: ['@open.gov.sg'],
  },
}

export const WithEmailConfirmation = Template.bind({})
WithEmailConfirmation.args = {
  field: {
    ...DEFAULT_EMAIL_FIELD,
    autoReplyOptions: {
      hasAutoReply: true,
      autoReplySubject: 'Storybook email confirmation',
      autoReplySender: 'Form Storybook Team',
      autoReplyMessage: 'This is a message that the user will see',
      includeFormSummary: false,
    },
  },
}
