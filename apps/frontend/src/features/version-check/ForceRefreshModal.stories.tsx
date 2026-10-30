import { Meta, StoryFn } from '@storybook/react'
import { http, HttpResponse } from 'msw'

import { ClientEnvVars } from 'formsg-shared/types/core'

import { fullScreenDecorator } from '~utils/storybook'

import { ForceRefreshModal } from './ForceRefreshModal'

const mockEnvWithVersion = (appVersion: string) => [
  http.get<never, never, Partial<ClientEnvVars>>('/api/v3/client/env', () =>
    HttpResponse.json({ appVersion }),
  ),
]

export default {
  title: 'Features/VersionCheck/ForceRefreshModal',
  component: ForceRefreshModal,
  decorators: [fullScreenDecorator],
  parameters: {
    layout: 'fullscreen',
    // Prevent flaky tests due to modal animating in.
    chromatic: { pauseAnimationAtEnd: true },
  },
} as Meta<typeof ForceRefreshModal>

const Template: StoryFn<typeof ForceRefreshModal> = (args) => (
  <ForceRefreshModal {...args} />
)

/** Backend has crossed a major version boundary: modal is shown. */
export const BreakingChange = Template.bind({})
BreakingChange.args = { clientVersion: '9.6.1-develop-abc12345' }
BreakingChange.parameters = {
  msw: { handlers: { env: mockEnvWithVersion('10.0.0') } },
}

/** Backend is newer but within the same major: nothing is rendered. */
export const NonBreakingChange = Template.bind({})
NonBreakingChange.args = { clientVersion: '9.6.1' }
NonBreakingChange.parameters = {
  msw: { handlers: { env: mockEnvWithVersion('9.7.0') } },
}

/** Local dev / unknown bundle version: nothing is rendered. */
export const UnknownClientVersion = Template.bind({})
UnknownClientVersion.args = { clientVersion: '' }
UnknownClientVersion.parameters = {
  msw: { handlers: { env: mockEnvWithVersion('10.0.0') } },
}
