import { Meta, Story } from '@storybook/react'

import { AttachmentSize, BasicField } from '~shared/types/field'
import {
  AdminFormDto,
  LogicConditionState,
  LogicIfValue,
  LogicType,
} from '~shared/types/form'

import { getAdminFormResponse } from '~/mocks/msw/handlers/admin-form'

import { StoryRouter } from '~utils/storybook'

import { BuilderLogic } from './BuilderLogic'
import { BuilderLogicProvider } from './BuilderLogicContext'

const buildMswRoutes = (overrides?: Partial<AdminFormDto>, delay = 0) => [
  getAdminFormResponse(overrides, delay),
]

export default {
  title: 'Pages/AdminFormPage/Logic',
  component: BuilderLogic,
  decorators: [
    (storyFn) => <BuilderLogicProvider>{storyFn()}</BuilderLogicProvider>,
    StoryRouter({ initialEntries: ['/12345'], path: '/:formId' }),
  ],
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
    form_fields: [
      {
        title: 'Do you want to upload an attachment?',
        description: '',
        required: true,
        disabled: false,
        fieldType: BasicField.YesNo,
        _id: '620115cf3bc125001349f9c3',
      },
      {
        title: 'Are you really sure you want to upload an attachment?',
        description: '',
        required: true,
        disabled: false,
        fieldType: BasicField.YesNo,
        _id: '620115cf3bc125001349f9c6',
      },
      {
        title: 'Upload instructions',
        description: '',
        required: true,
        disabled: false,
        fieldType: BasicField.Image,
        _id: '6200e1534ad4f00012848d65',
        url: 'some-mock-url',
        fileMd5Hash: 'wrjH62qBTpg0uIk4GMzOCA==',
        name: 'Upload instructions.png',
        size: '0.03 MB',
      },
      {
        title: 'Upload attachment',
        description: '',
        required: true,
        disabled: false,
        fieldType: BasicField.Attachment,
        _id: '61e6857c9c794b0012f1c6f7',
        attachmentSize: AttachmentSize.OneMb,
      },
    ],
    form_logics: [
      {
        show: ['6200e1534ad4f00012848d65', '61e6857c9c794b0012f1c6f7'],
        _id: '620115f74ad4f00012900a8c',
        logicType: LogicType.ShowFields,
        conditions: [
          {
            ifValueType: LogicIfValue.SingleSelect,
            field: '620115cf3bc125001349f9c3',
            state: LogicConditionState.Equal,
            value: 'Yes',
          },
          {
            ifValueType: LogicIfValue.SingleSelect,
            field: '620115cf3bc125001349f9c6',
            state: LogicConditionState.Equal,
            value: 'Yes',
          },
        ],
      },
      {
        show: ['6200e1534ad4f00012848d65', '61e6857c9c794b0012f1c6f7'],
        _id: '620115f74ad4f00012900a8d',
        logicType: LogicType.ShowFields,
        conditions: [
          {
            ifValueType: LogicIfValue.SingleSelect,
            field: '620115cf3bc125001349f9c3',
            state: LogicConditionState.Equal,
            value: 'Yes',
          },
          {
            ifValueType: LogicIfValue.SingleSelect,
            field: '620115cf3bc125001349f9c6',
            state: LogicConditionState.Equal,
            value: 'Yes',
          },
        ],
      },
    ],
  }),
}
