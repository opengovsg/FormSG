import { Meta, Story } from '@storybook/react'

import { FormAuthType } from '~shared/types/form'

import { getPublicFormResponse } from '~/mocks/msw/handlers/public-form'

import { StoryRouter } from '~utils/storybook'

import { PublicFormPage } from './PublicFormPage'

export default {
  title: 'Pages/PublicFormPage',
  component: PublicFormPage,
  decorators: [
    StoryRouter({
      initialEntries: ['/61540ece3d4a6e50ac0cc6ff'],
      path: '/:formId',
    }),
  ],
  parameters: {
    // Required so skeleton "animation" does not hide content.
    chromatic: { pauseAnimationAtEnd: true },
    layout: 'fullscreen',
    msw: [getPublicFormResponse({ delay: 0 })],
  },
} as Meta

const Template: Story = () => <PublicFormPage />
export const Default = Template.bind({})

export const Loading = Template.bind({})
Loading.parameters = {
  msw: [getPublicFormResponse({ delay: 'infinite' })],
}

export const SingpassUnauthorized = Template.bind({})
SingpassUnauthorized.storyName = 'Singpass/Unauthorized'
SingpassUnauthorized.parameters = {
  msw: [
    getPublicFormResponse({
      delay: 0,
      overrides: {
        form: {
          title: 'Singpass login form',
          authType: FormAuthType.SP,
        },
      },
    }),
  ],
}

export const SingpassAuthorized = Template.bind({})
SingpassAuthorized.storyName = 'Singpass/Authorized'
SingpassAuthorized.parameters = {
  msw: [
    getPublicFormResponse({
      delay: 0,
      overrides: {
        form: {
          title: 'Singpass login form',
          authType: FormAuthType.SP,
        },
        spcpSession: {
          userName: 'S1234567A',
        },
      },
    }),
  ],
}

export const CorppassUnauthorized = Template.bind({})
CorppassUnauthorized.storyName = 'Corppass/Unauthorized'
CorppassUnauthorized.parameters = {
  msw: [
    getPublicFormResponse({
      delay: 0,
      overrides: {
        form: {
          title: 'Corppass login form',
          authType: FormAuthType.CP,
        },
      },
    }),
  ],
}

export const CorppassAuthorized = Template.bind({})
CorppassAuthorized.storyName = 'Corppass/Authorized'
CorppassAuthorized.parameters = {
  msw: [
    getPublicFormResponse({
      delay: 0,
      overrides: {
        form: {
          title: 'Corppass login form',
          authType: FormAuthType.CP,
        },
        spcpSession: {
          userName: '200000000A',
        },
      },
    }),
  ],
}

export const SgidUnauthorized = Template.bind({})
SgidUnauthorized.storyName = 'SGID/Unauthorized'
SgidUnauthorized.parameters = {
  msw: [
    getPublicFormResponse({
      delay: 0,
      overrides: {
        form: {
          title: 'SGID login form',
          authType: FormAuthType.SGID,
        },
      },
    }),
  ],
}

export const SgidAuthorized = Template.bind({})
SgidAuthorized.storyName = 'SGID/Authorized'
SgidAuthorized.parameters = {
  msw: [
    getPublicFormResponse({
      delay: 0,
      overrides: {
        form: {
          title: 'SGID login form',
          authType: FormAuthType.SGID,
        },
        spcpSession: {
          userName: 'S0000000Z',
        },
      },
    }),
  ],
}
