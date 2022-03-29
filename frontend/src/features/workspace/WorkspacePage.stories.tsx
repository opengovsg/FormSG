import { Meta, Story } from '@storybook/react'
import { times } from 'lodash'
import { rest } from 'msw'

import {
  AdminDashboardFormMetaDto,
  FormResponseMode,
  FormStatus,
} from '~shared/types/form/form'

import { ROOT_ROUTE } from '~constants/routes'
import {
  getMobileViewParameters,
  mockDateDecorator,
  StoryRouter,
} from '~utils/storybook'

import { WorkspacePage } from './WorkspacePage'

const createForm = (num: number) => {
  return times(num, (x) => {
    return {
      _id: `618b2d5e648fb700700002b${x}`,
      status: x % 2 ? FormStatus.Public : FormStatus.Private,
      responseMode: x % 2 ? FormResponseMode.Email : FormResponseMode.Encrypt,
      title: `Test workspace form email ${x}`,
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

const THIRTY_FORMS = createForm(30)

export default {
  title: 'Pages/WorkspacePage',
  component: WorkspacePage,
  decorators: [
    StoryRouter({
      initialEntries: [ROOT_ROUTE],
      path: ROOT_ROUTE,
    }),
    mockDateDecorator,
  ],
  parameters: {
    layout: 'fullscreen',
    // Required so skeleton "animation" does not hide content.
    chromatic: { pauseAnimationAtEnd: true },
    mockdate: new Date('2021-12-01T06:22:27.219Z'),
    msw: [
      rest.get<AdminDashboardFormMetaDto[]>(
        '/api/v3/admin/forms',
        (req, res, ctx) => {
          return res(ctx.json(THIRTY_FORMS))
        },
      ),
    ],
  },
} as Meta

const Template: Story = () => <WorkspacePage />
export const Desktop = Template.bind({})
export const Mobile = Template.bind({})
Mobile.parameters = {
  ...getMobileViewParameters(),
  a11y: {
    config: {
      // Seems to be a false positive, since a loading screen should have nothing focusable.
      // And only occurs during mobile loading.
      rules: [{ id: 'scrollable-region-focusable', enabled: false }],
    },
  },
}

export const LoadingDesktop = Template.bind({})
LoadingDesktop.parameters = {
  msw: [
    rest.get<AdminDashboardFormMetaDto[]>(
      '/api/v3/admin/forms',
      (req, res, ctx) => {
        return res(ctx.delay('infinite'), ctx.json({}))
      },
    ),
  ],
}

export const LoadingMobile = Template.bind({})
LoadingMobile.parameters = {
  ...Mobile.parameters,
  ...LoadingDesktop.parameters,
}

export const Empty = Template.bind({})
Empty.parameters = {
  msw: [
    rest.get<AdminDashboardFormMetaDto[]>(
      '/api/v3/admin/forms',
      (req, res, ctx) => {
        return res(ctx.json([]))
      },
    ),
  ],
}

export const EmptyMobile = Template.bind({})
EmptyMobile.parameters = {
  ...Empty.parameters,
  ...Mobile.parameters,
}
