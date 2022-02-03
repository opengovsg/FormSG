import { Meta, Story } from '@storybook/react'

import {
  AdminFormDto,
  LogicConditionState,
  LogicIfValue,
  LogicType,
} from '~shared/types/form'

import { getAdminFormResponse } from '~/mocks/msw/handlers/admin-form'

import { StoryRouter } from '~utils/storybook'

import { BuilderLogic } from './BuilderLogic'

const buildMswRoutes = (overrides?: Partial<AdminFormDto>, delay = 0) => [
  getAdminFormResponse(overrides, delay),
]

export default {
  title: 'Pages/AdminFormPage/Logic',
  component: BuilderLogic,
  decorators: [StoryRouter({ initialEntries: ['/12345'], path: '/:formId' })],
  parameters: {
    layout: 'fullscreen',
    // Required so skeleton "animation" does not hide content.
    chromatic: { pauseAnimationAtEnd: true },
    msw: buildMswRoutes(),
  },
} as Meta

const Template: Story = () => <BuilderLogic />
export const NoLogic = Template.bind({})
NoLogic.parameters = {
  msw: buildMswRoutes({ form_logics: [] }),
}

export const WithLogic = Template.bind({})
WithLogic.parameters = {
  msw: buildMswRoutes({
    form_logics: [
      {
        logicType: LogicType.ShowFields,
        conditions: [
          {
            field: 'some-field',
            state: LogicConditionState.Equal,
            value: 0,
            ifValueType: LogicIfValue.Number,
          },
        ],
        show: ['another-field'],
      },
    ],
  }),
}
