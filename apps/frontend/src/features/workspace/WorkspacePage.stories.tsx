import { Meta, StoryFn } from '@storybook/react-vite'
import { times } from 'lodash'
import { delay as MswDelay, http, HttpResponse } from 'msw'

import { UserId } from 'formsg-shared/types'
import {
  AdminDashboardFormMetaDto,
  FormResponseMode,
  FormStatus,
} from 'formsg-shared/types/form/form'

import { envHandlers } from '~/mocks/msw/handlers/env'
import { getUser, MOCK_USER } from '~/mocks/msw/handlers/user'
import { getWorkspaces } from '~/mocks/msw/handlers/workspace'

import { DASHBOARD_ROUTE } from '~constants/routes'
import {
  LoggedInDecorator,
  mockDateDecorator,
  StoryRouter,
  ViewedEmergencyContactDecorator,
  ViewedRolloutDecorator,
  viewportModes,
} from '~utils/storybook'

import { WorkspacePage } from './WorkspacePage'

const createForm = (num: number, overrideTitle?: string) => {
  return times(num, (x) => {
    return {
      _id: `618b2d5e648fb700700002b${x}`,
      status: x % 2 ? FormStatus.Public : FormStatus.Private,
      responseMode: x % 2 ? FormResponseMode.Email : FormResponseMode.Encrypt,
      title: overrideTitle ?? `Test workspace form email ${x}`,
      admin: {
        _id: '618b2cc0648fb70070000292',
        email: 'test@example.com',
        agency: {
          _id: '618aaf0725e150255e745a23',
          shortName: 'test',
          fullName: 'Test Technology Agency',
          logo: 'path/to/logo',
          emailDomain: ['example.com'],
        },
      },
      lastModified: `2021-11-${((x % 30) + 1)
        .toString()
        .padStart(2, '0')}T07:46:29.388Z`,
    }
  }).reverse()
}

const THIRTY_FORMS = [
  ...createForm(
    1,
    'This is a very very very very very very very very long title it should be properly truncated only in desktop view',
  ),
  ...createForm(29),
] as AdminDashboardFormMetaDto[]

const BASE_MSW_HANDLERS = [
  ...envHandlers,
  http.get<never, never, AdminDashboardFormMetaDto[]>(
    '/api/v3/admin/forms',
    () => {
      return HttpResponse.json(THIRTY_FORMS)
    },
  ),
  getWorkspaces(),
  getUser({
    delay: 0,
    mockUser: {
      ...MOCK_USER,
      email: 'super_super_super_super_super_long_name@example.com',
    },
  }),
]

export default {
  title: 'Pages/WorkspacePage',
  component: WorkspacePage,
  decorators: [
    ViewedRolloutDecorator,
    StoryRouter({
      initialEntries: [DASHBOARD_ROUTE],
      path: DASHBOARD_ROUTE,
    }),
    mockDateDecorator,
    LoggedInDecorator,
    ViewedEmergencyContactDecorator,
  ],
  parameters: {
    layout: 'fullscreen',
    // Pages fill the viewport; fit-to-content would crop them.
    argos: { fitToContent: false },
    mockdate: new Date('2021-12-01T06:22:27.219Z'),
    msw: BASE_MSW_HANDLERS,
  },
} as Meta

const Template: StoryFn = () => <WorkspacePage />
export const Desktop = Template.bind({})
Desktop.parameters = { argos: { modes: viewportModes('mobile') } }

export const LoadingDesktop = Template.bind({})
LoadingDesktop.parameters = {
  a11y: {
    config: {
      // Seems to be a false positive, since a loading screen should have nothing focusable.
      // And only occurs during mobile loading.
      rules: [{ id: 'scrollable-region-focusable', enabled: false }],
    },
  },
  argos: { modes: viewportModes('mobile') },
  msw: [
    http.get<never, never, AdminDashboardFormMetaDto[]>(
      '/api/v3/admin/forms',
      async () => {
        await MswDelay('infinite')
        return HttpResponse.json([])
      },
    ),
  ],
}

export const Empty = Template.bind({})
Empty.parameters = {
  argos: { modes: viewportModes('mobile') },
  msw: [
    ...envHandlers,
    http.get<never, never, AdminDashboardFormMetaDto[]>(
      '/api/v3/admin/forms',
      () => {
        return HttpResponse.json([])
      },
    ),
    getWorkspaces(),
    getUser({
      delay: 0,
      mockUser: {
        ...MOCK_USER,
        _id: 'undefined' as UserId,
        email: 'meh@example.com',
      },
    }),
  ],
}

export const EmptyWithAnnouncementModal = Template.bind({})
EmptyWithAnnouncementModal.parameters = {
  argos: { modes: viewportModes('mobile') },
  msw: [
    http.get<never, never, AdminDashboardFormMetaDto[]>(
      '/api/v3/admin/forms',
      () => {
        return HttpResponse.json([])
      },
    ),
    ...BASE_MSW_HANDLERS,
  ],
}

export const AllOpenDesktop = Template.bind({})
AllOpenDesktop.parameters = {
  argos: { modes: viewportModes('mobile') },
  msw: [
    http.get<never, never, AdminDashboardFormMetaDto[]>(
      '/api/v3/admin/forms',
      () => {
        return HttpResponse.json(
          THIRTY_FORMS.filter((form) => form.status === FormStatus.Public),
        )
      },
    ),
    ...BASE_MSW_HANDLERS,
  ],
}

export const AllOpenDesktopNoAnnouncementModal = Template.bind({})
AllOpenDesktopNoAnnouncementModal.parameters = {
  argos: { modes: viewportModes('mobile') },
  ...AllOpenDesktop.parameters,
  msw: [
    ...envHandlers,
    http.get<never, never, AdminDashboardFormMetaDto[]>(
      '/api/v3/admin/forms',
      () => {
        return HttpResponse.json(THIRTY_FORMS)
      },
    ),
    getWorkspaces(),
    getUser({
      delay: 0,
      mockUser: {
        ...MOCK_USER,
        _id: 'undefined' as UserId,
        email: 'meh@example.com',
      },
    }),
  ],
}
