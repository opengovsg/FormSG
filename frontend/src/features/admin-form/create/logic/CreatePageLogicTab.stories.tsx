import { Meta, StoryFn } from '@storybook/react'

import { AttachmentSize, BasicField, FormFieldDto } from '~shared/types/field'
import {
  AdminFormDto,
  LogicConditionState,
  LogicDto,
  LogicIfValue,
  LogicType,
} from '~shared/types/form'

import {
  createFormBuilderMocks,
  createLogic,
  deleteLogic,
} from '~/mocks/msw/handlers/admin-form'

import { StoryRouter, viewports } from '~utils/storybook'

import { CreatePageLogicTab } from './CreatePageLogicTab'

const buildMswRoutes = (
  overrides?: Partial<AdminFormDto>,
  delay: number | 'infinite' = 0,
) => [
  ...createFormBuilderMocks(overrides, delay),
  createLogic(delay),
  deleteLogic(delay),
]

export default {
  title: 'Pages/AdminFormPage/Create/LogicTab',
  component: CreatePageLogicTab,
  decorators: [StoryRouter({ initialEntries: ['/12345'], path: '/:formId' })],
  parameters: {
    layout: 'fullscreen',
    // Required so skeleton "animation" does not hide content.
    // Pass a very short delay to avoid bug where Chromatic takes a snapshot before
    // the story has loaded
    chromatic: { pauseAnimationAtEnd: true, delay: 50 },
    msw: buildMswRoutes(),
  },
} as Meta

const form_field_1: FormFieldDto = {
  title: 'Do you want to upload an attachment?',
  description: '',
  required: true,
  disabled: false,
  fieldType: BasicField.YesNo,
  _id: '620115cf3bc125001349f9c3',
}

const form_field_2: FormFieldDto = {
  title: 'Are you really sure you want to upload an attachment?',
  description: '',
  required: true,
  disabled: false,
  fieldType: BasicField.YesNo,
  _id: '620115cf3bc125001349f9c6',
}

const form_field_3: FormFieldDto = {
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
}

const form_field_4: FormFieldDto = {
  title: 'Upload attachment',
  description: '',
  required: true,
  disabled: false,
  fieldType: BasicField.Attachment,
  _id: '61e6857c9c794b0012f1c6f7',
  attachmentSize: AttachmentSize.OneMb,
}

const if_12_show_34: LogicDto = {
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
}

const if_12_preventsubmit: LogicDto = {
  preventSubmitMessage:
    'Some message to tell the user why they can not submit. This should be rendered in the storybook mock.',
  _id: '620115f74ad4f00012900a8d',
  logicType: LogicType.PreventSubmit,
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
}

const FORM_WITH_LOGIC: Partial<AdminFormDto> = {
  form_fields: [form_field_1, form_field_2, form_field_3, form_field_4],
  form_logics: [if_12_show_34, if_12_preventsubmit],
}

const Template: StoryFn = () => <CreatePageLogicTab />
export const NoLogic = Template.bind({})
NoLogic.parameters = {
  msw: buildMswRoutes({ form_logics: [] }),
}

export const MobileNoLogic = Template.bind({})
MobileNoLogic.parameters = {
  msw: buildMswRoutes({ form_logics: [] }),
  viewport: {
    defaultViewport: 'mobile1',
  },
  chromatic: { viewports: [viewports.xs] },
}

export const WithLogic = Template.bind({})
WithLogic.parameters = {
  msw: buildMswRoutes(FORM_WITH_LOGIC),
}

export const MobileWithLogic = Template.bind({})
MobileWithLogic.parameters = {
  msw: buildMswRoutes(FORM_WITH_LOGIC),
  viewport: {
    defaultViewport: 'mobile1',
  },
  chromatic: { viewports: [viewports.xs] },
}

export const ErrorIfDeleted = Template.bind({})
ErrorIfDeleted.parameters = {
  msw: buildMswRoutes({
    form_fields: [form_field_2, form_field_3, form_field_4],
    form_logics: [if_12_show_34, if_12_preventsubmit],
  }),
}

export const ErrorShowSomeDeleted = Template.bind({})
ErrorShowSomeDeleted.parameters = {
  msw: buildMswRoutes({
    form_fields: [form_field_1, form_field_2, form_field_4],
    form_logics: [if_12_show_34, if_12_preventsubmit],
  }),
}

export const ErrorShowAllDeleted = Template.bind({})
ErrorShowAllDeleted.parameters = {
  msw: buildMswRoutes({
    form_fields: [form_field_1, form_field_2],
    form_logics: [if_12_show_34, if_12_preventsubmit],
  }),
}

export const ErrorAllDeleted = Template.bind({})
ErrorAllDeleted.parameters = {
  msw: buildMswRoutes({ form_logics: [if_12_show_34, if_12_preventsubmit] }),
}

export const Loading = Template.bind({})
Loading.parameters = {
  msw: buildMswRoutes({}, 'infinite'),
}
