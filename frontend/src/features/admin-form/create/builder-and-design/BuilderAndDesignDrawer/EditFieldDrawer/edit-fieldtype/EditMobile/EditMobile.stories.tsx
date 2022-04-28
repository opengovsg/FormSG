import { Box, useDisclosure } from '@chakra-ui/react'
import { DecoratorFn, Meta, Story } from '@storybook/react'

import { BasicField, MobileFieldBase } from '~shared/types'

import { createFormBuilderMocks } from '~/mocks/msw/handlers/admin-form'
import { getFreeSmsQuota } from '~/mocks/msw/handlers/admin-form/twilio'

import { StoryRouter } from '~utils/storybook'

import { BuilderAndDesignContext } from '~features/admin-form/create/builder-and-design/BuilderAndDesignContext'
import { CreatePageSidebarProvider } from '~features/admin-form/create/common/CreatePageSidebarContext'

import { EditMobile } from './EditMobile'

const DEFAULT_MOBILE_FIELD: MobileFieldBase = {
  allowIntlNumbers: false,
  isVerifiable: false,
  title: 'Mobile Number',
  description: '',
  required: true,
  disabled: false,
  fieldType: BasicField.Mobile,
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
  title: 'Features/AdminForm/EditFieldDrawer/EditMobile',
  component: EditMobile,
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
    msw: [getFreeSmsQuota(), ...createFormBuilderMocks({}, 0)],
  },
  args: {
    field: DEFAULT_MOBILE_FIELD,
  },
} as Meta<StoryArgs>

interface StoryArgs {
  field: MobileFieldBase
}

const Template: Story<StoryArgs> = ({ field }) => {
  return <EditMobile field={field} />
}

export const Default = Template.bind({})
Default.args = {
  field: {
    ...DEFAULT_MOBILE_FIELD,
    isVerifiable: true,
  },
}

export const Loading = Template.bind({})
Loading.parameters = {
  msw: [
    getFreeSmsQuota({ delay: 'infinite' }),
    ...createFormBuilderMocks({}, 0),
  ],
}

export const VerifiedQuotaExceeded = Template.bind({})
VerifiedQuotaExceeded.parameters = {
  msw: [
    getFreeSmsQuota({
      override: {
        freeSmsCounts: 10000,
        quota: 10000,
      },
    }),
    ...createFormBuilderMocks({}, 0),
  ],
}

export const HasCustomCredentials = Template.bind({})
HasCustomCredentials.parameters = {
  msw: [
    getFreeSmsQuota({
      override: {
        freeSmsCounts: 10000,
        quota: 10000,
      },
    }),
    ...createFormBuilderMocks({ msgSrvcName: 'custom-credentials' }, 0),
  ],
}
