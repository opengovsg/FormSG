import { Meta, StoryFn } from '@storybook/react'
import { expect, screen, userEvent, waitFor, within } from '@storybook/test'

import { PaymentChannel, PaymentType, UserId } from '~shared/types'
import {
  AdminFormDto,
  FormAuthType,
  FormColorTheme,
  FormLogoState,
  FormResponseMode,
} from '~shared/types/form'

import {
  createFormBuilderMocks,
  getAdminFormCollaborators,
  getAdminFormSettings,
  getAdminFormSubmissions,
  MOCK_FORM_FIELDS,
  MOCK_FORM_FIELDS_WITH_MYINFO,
  MOCK_FORM_LOGICS,
  TABLE_FIELD_ADDITIONAL_ROWS_FIELD,
} from '~/mocks/msw/handlers/admin-form'
import { getUser, MOCK_USER } from '~/mocks/msw/handlers/user'

import {
  ADMIN_FORM_CREATE_PAGE_FORM_ID,
  AdminFormCreatePageDecorator,
  getMobileViewParameters,
  getTabletViewParameters,
  LoggedInDecorator,
  mockDateDecorator,
  ViewedFeatureTourDecorator,
} from '~utils/storybook'

import { CreatePage } from '~features/admin-form/create/CreatePage'

import { useMagicFormBuilderStore } from './create/builder-and-design/MagicFormBuilder/useMagicFormBuilderStore'

const buildMswRoutes = (
  overrides?: Partial<AdminFormDto>,
  delay?: number | 'infinite' | 'real',
) => {
  return [
    getAdminFormSettings(),
    getAdminFormCollaborators(),
    getAdminFormSubmissions(),
    ...createFormBuilderMocks(
      {
        ...overrides,
        startPage: {
          logo: { state: FormLogoState.Default },
          colorTheme: FormColorTheme.Blue,
          paragraph: 'Fill in this mock form in this story.',
          estTimeTaken: 300,
        },
      },
      delay,
    ),
    getAdminFormSubmissions(),
    getUser({
      delay: 0,
      mockUser: { ...MOCK_USER, _id: 'adminFormTestUserId' as UserId },
    }),
  ]
}

export default {
  title: 'Pages/AdminFormPage/Create',
  // component: To be implemented,
  decorators: [
    ViewedFeatureTourDecorator,
    AdminFormCreatePageDecorator,
    LoggedInDecorator,
    mockDateDecorator,
  ],
  parameters: {
    // Required so skeleton "animation" does not hide content.
    // Pass a very short delay to avoid bug where Chromatic takes a snapshot before
    // the story has loaded
    chromatic: { pauseAnimationAtEnd: true, delay: 200 },
    layout: 'fullscreen',
    msw: { handlers: { default: buildMswRoutes() } },
    mockdate: new Date('2022-12-25T06:22:27.219Z'),
    userId: 'adminFormTestUserId',
  },
} as Meta

const Template: StoryFn = () => <CreatePage />
export const DesktopEmpty = Template.bind({})
export const DesktopAllFields = Template.bind({})
DesktopAllFields.parameters = {
  msw: {
    handlers: {
      default: buildMswRoutes({
        form_fields: MOCK_FORM_FIELDS_WITH_MYINFO,
        authType: FormAuthType.MyInfo,
        responseMode: FormResponseMode.Email,
      }),
    },
  },
}

export const DesktopFieldsWithAcceptDeny = Template.bind({})
DesktopFieldsWithAcceptDeny.parameters = {
  msw: {
    handlers: {
      default: buildMswRoutes({
        form_fields: MOCK_FORM_FIELDS,
      }),
    },
  },
}
DesktopFieldsWithAcceptDeny.decorators = [
  (Story) => {
    const store = useMagicFormBuilderStore.getState()
    store.recentlyCreatedFieldIds = {
      [ADMIN_FORM_CREATE_PAGE_FORM_ID]: new Set(
        MOCK_FORM_FIELDS.slice(0, 5).map((field) => field._id),
      ),
    }

    return <Story />
  },
]

export const DesktopLoading = Template.bind({})
DesktopLoading.parameters = {
  msw: {
    handlers: {
      default: buildMswRoutes({}, 'infinite'),
    },
  },
}

export const TabletEmpty = Template.bind({})
TabletEmpty.parameters = getTabletViewParameters()
export const TabletAllFields = Template.bind({})
TabletAllFields.parameters = {
  ...getTabletViewParameters(),
  msw: {
    handlers: {
      default: buildMswRoutes({ form_fields: MOCK_FORM_FIELDS_WITH_MYINFO }),
    },
  },
}
export const TabletLoading = Template.bind({})
TabletLoading.parameters = {
  ...getTabletViewParameters(),
  mockdate: new Date('2024-09-11T13:00:00.000Z'),
  msw: {
    handlers: {
      default: buildMswRoutes({}, 'infinite'),
    },
  },
}

export const MobileEmpty = Template.bind({})
MobileEmpty.parameters = getMobileViewParameters()
export const MobileAllFields = Template.bind({})
MobileAllFields.parameters = {
  ...getMobileViewParameters(),
  msw: {
    handlers: {
      default: buildMswRoutes({ form_fields: MOCK_FORM_FIELDS_WITH_MYINFO }),
    },
  },
}
export const MobileLoading = Template.bind({})
MobileLoading.parameters = {
  ...getMobileViewParameters(),
  msw: {
    handlers: {
      default: buildMswRoutes({}, 'infinite'),
    },
  },
}

export const AllFieldsFieldsHiddenByLogic = Template.bind({})
AllFieldsFieldsHiddenByLogic.parameters = {
  msw: buildMswRoutes({
    form_fields: MOCK_FORM_FIELDS_WITH_MYINFO,
    form_logics: MOCK_FORM_LOGICS,
    authType: FormAuthType.MyInfo,
    responseMode: FormResponseMode.Email,
  }),
}

export const FormWithWebhook = Template.bind({})
FormWithWebhook.parameters = {
  msw: {
    handlers: {
      default: [
        getAdminFormSettings({
          overrides: {
            webhook: {
              url: 'some-webhook-url',
              isRetryEnabled: false,
            },
          },
        }),
        ...buildMswRoutes(),
      ],
    },
  },
}

export const FormWithWebhookMobile = Template.bind({})
FormWithWebhookMobile.parameters = {
  ...FormWithWebhook.parameters,
  ...getMobileViewParameters(),
}

export const FormWithPayment = Template.bind({})
FormWithPayment.parameters = {
  msw: {
    handlers: {
      default: buildMswRoutes({
        responseMode: FormResponseMode.Encrypt,
        payments_channel: {
          channel: PaymentChannel.Stripe,
          target_account_id: 'acct_sampleid',
          publishable_key: 'pk_samplekey',
        },
        payments_field: {
          enabled: true,
          description: 'Test event registration fee',
          payment_type: PaymentType.Variable,
          min_amount: 1000,
          max_amount: 5000,
        },
      }),
    },
  },
}

export const FormWithPaymentMobile = Template.bind({})
FormWithPaymentMobile.parameters = {
  ...FormWithPayment.parameters,
  ...getMobileViewParameters(),
}

export const AdminFormBuilderWithAdditionalRowsTableField = Template.bind({})
AdminFormBuilderWithAdditionalRowsTableField.parameters = {
  msw: buildMswRoutes({
    form_fields: [TABLE_FIELD_ADDITIONAL_ROWS_FIELD],
  }),
  viewport: {
    value: 'lg', // Forces to desktop view so that the edit drawer opens when the table field is clicked
  },
  docs: {
    storyDescription: `Verifies that the table field rows are updated when the minimum rows is updated. Needs to be in lg viewport to work.`,
  },
}

AdminFormBuilderWithAdditionalRowsTableField.play = async ({
  canvasElement,
  step,
}) => {
  const canvas = within(canvasElement)

  let tableFieldTable: HTMLElement

  await step(
    'Find the table field table and add another row button',
    async () => {
      await waitFor(async () => {
        const foundTableFieldGroup = canvas.getByRole('group', {
          name: (_, element) => {
            const label = element.querySelector(
              '#table-field-for-test-id-label',
            )
            return !!label
          },
        })
        if (!foundTableFieldGroup)
          throw new Error('Table field group not found')
        const foundTableFieldTable =
          within(foundTableFieldGroup).getByRole('table')
        if (!foundTableFieldTable)
          throw new Error('Table field table not found')
        tableFieldTable = foundTableFieldTable
      })
    },
  )

  await step(
    `Assert that the table is initiated with ${TABLE_FIELD_ADDITIONAL_ROWS_FIELD.minimumRows} rows which is the minimum rows`,
    async () => {
      await waitFor(async () => {
        const rowGroups = within(tableFieldTable).getAllByRole('rowgroup')
        const tbody = rowGroups.find((group) => group.localName === 'tbody')
        if (!tbody) throw new Error('Table field table body not found')
        const rows = within(tbody).getAllByRole('row')
        expect(rows).toHaveLength(
          Number(TABLE_FIELD_ADDITIONAL_ROWS_FIELD.minimumRows),
        )
      })
    },
  )

  await step(
    'Find and click on the HighlightableFlex component surrounding the table field',
    async () => {
      await waitFor(async () => {
        // Find the HighlightableFlex by looking for the field container that contains the table field
        // The HighlightableFlex is the clickable wrapper around the field with role="button"
        const highlightableFlex = canvas.getByRole('button', {
          name: (content, element) => {
            // Look for a button that contains the table field title
            // The HighlightableFlex wraps the entire field including its title
            return content.includes('Table field for test')
          },
        })

        if (!highlightableFlex) {
          throw new Error('HighlightableFlex component not found')
        }

        await userEvent.click(highlightableFlex)
      })
    },
  )

  await step('Update the minimum rows to 4', async () => {
    await waitFor(async () => {
      const minimumRowsInput = screen.getByText('Minimum rows')
      console.log('minimumRowsInput', minimumRowsInput.outerHTML)
      if (!minimumRowsInput) throw new Error('Minimum rows input not found')
      await userEvent.click(minimumRowsInput)
      await userEvent.keyboard('{arrowright}{backspace}4')
    })
  })

  await step(`Assert that the table is updated to have 4 rows`, async () => {
    await waitFor(async () => {
      const rowGroups = within(tableFieldTable).getAllByRole('rowgroup')
      const tbody = rowGroups.find((group) => group.localName === 'tbody')
      if (!tbody) throw new Error('Table field table body not found')
      const rows = within(tbody).getAllByRole('row')
      expect(rows).toHaveLength(4)
    })
  })

  await step('Update the minimum rows to 1', async () => {
    await waitFor(async () => {
      const minimumRowsInput = screen.getByText('Minimum rows')
      console.log('minimumRowsInput', minimumRowsInput.outerHTML)
      if (!minimumRowsInput) throw new Error('Minimum rows input not found')
      await userEvent.click(minimumRowsInput)
      await userEvent.keyboard('{arrowright}{backspace}1')
    })
  })

  await step(`Assert that the table is updated to have 1 rows`, async () => {
    await waitFor(async () => {
      const rowGroups = within(tableFieldTable).getAllByRole('rowgroup')
      const tbody = rowGroups.find((group) => group.localName === 'tbody')
      if (!tbody) throw new Error('Table field table body not found')
      const rows = within(tbody).getAllByRole('row')
      expect(rows).toHaveLength(1)
    })
  })
}
