import { Route } from 'react-router'
import {
  createMemoryRouter,
  createRoutesFromElements,
  RouterProvider,
} from 'react-router-dom'
import { GrowthBook, GrowthBookProvider } from '@growthbook/growthbook-react'
import { Meta, StoryFn } from '@storybook/react-vite'
import { expect, userEvent, waitFor, within } from 'storybook/test'

import { featureFlags } from 'formsg-shared/constants'
import { FormResponseMode } from 'formsg-shared/types/form'

import {
  createFormBuilderMocks,
  getAdminFormCollaborators,
  getAdminFormSubmissions,
  getMultiRespondentSubmissionMetadataResponse,
  getStorageSubmission,
  getStorageSubmissionMetadataResponse,
} from '~/mocks/msw/handlers/admin-form'
import { getUser } from '~/mocks/msw/handlers/user'

import {
  ADMINFORM_RESULTS_SUBROUTE,
  ADMINFORM_ROUTE,
  RESULTS_FEEDBACK_SUBROUTE,
} from '~constants/routes'
import { viewportModes } from '~utils/storybook'

import { AdminFormLayout } from './common/AdminFormLayout'
import {
  FeedbackPage,
  FormResultsLayout,
  IndividualResponseDrawer,
  ResponsesLayout,
  ResponsesPage,
} from './responses'

export default {
  title: 'Pages/AdminFormPage/Results/ResponsesTab',
  parameters: {
    layout: 'fullscreen',
    // Pages fill the viewport; fit-to-content would crop them.
    argos: { fitToContent: false },
    msw: {
      handlers: {
        default: [
          ...createFormBuilderMocks({}, 0),
          getAdminFormSubmissions(),
          getUser(),
          getAdminFormCollaborators(),
        ],
      },
    },
  },
} as Meta

// Generated for testing.
const MOCK_KEYPAIR = {
  publicKey: 'lC4uMSTsWDuT6bZGE2cMEevSpIrcDoZOT1uyThWFzno=',
  secretKey: 'xdXNlI2HyZzsVXcvCR/LT4350oW/yRZNx2lMi+555Yk=',
}

const Template: StoryFn = () => {
  const router = createMemoryRouter(
    createRoutesFromElements(
      <Route path={`${ADMINFORM_ROUTE}/:formId`} element={<AdminFormLayout />}>
        <Route
          path={ADMINFORM_RESULTS_SUBROUTE}
          element={<FormResultsLayout />}
        >
          <Route element={<ResponsesLayout />}>
            <Route index element={<ResponsesPage />} />
          </Route>
          <Route path={RESULTS_FEEDBACK_SUBROUTE} element={<FeedbackPage />} />
        </Route>
      </Route>,
    ),
    {
      initialEntries: [
        `${ADMINFORM_ROUTE}/61540ece3d4a6e50ac0cc6ff/${ADMINFORM_RESULTS_SUBROUTE}`,
      ],
    },
  )
  return <RouterProvider router={router} />
}
export const EmailForm = Template.bind({})
EmailForm.parameters = { argos: { modes: viewportModes('tablet', 'mobile') } }

export const EmailFormLoading = Template.bind({})
EmailFormLoading.parameters = {
  msw: {
    handlers: {
      default: [
        ...createFormBuilderMocks({}, 0),
        getAdminFormSubmissions({ delay: 'infinite' }),
        getUser(),
        getAdminFormCollaborators(),
      ],
    },
  },
}

export const EmptyEmailForm = Template.bind({})
EmptyEmailForm.parameters = {
  msw: {
    handlers: {
      default: [
        ...createFormBuilderMocks({}, 0),
        getAdminFormSubmissions({
          override: 0,
        }),
        getUser(),
        getAdminFormCollaborators(),
      ],
    },
  },
}

export const StorageForm = Template.bind({})
StorageForm.parameters = {
  argos: { modes: viewportModes('tablet', 'mobile') },
  msw: {
    handlers: {
      default: [
        ...createFormBuilderMocks(
          {
            responseMode: FormResponseMode.Encrypt,
            publicKey: MOCK_KEYPAIR.publicKey,
          },
          0,
        ),
        getAdminFormSubmissions(),
        getStorageSubmissionMetadataResponse(),
        getUser(),
        getAdminFormCollaborators(),
      ],
    },
  },
}

export const StorageFormUnlocked = Template.bind({})
StorageFormUnlocked.parameters = StorageForm.parameters
StorageFormUnlocked.parameters = {
  ...StorageFormUnlocked.parameters,
  argos: {
    ...StorageFormUnlocked.parameters?.argos,
    modes: viewportModes('tablet', 'mobile'),
  },
}
StorageFormUnlocked.play = async ({ canvasElement }) => {
  const canvas = within(canvasElement)

  await waitFor(
    async () => {
      expect(canvas.getByTestId('secretKey')).not.toBeDisabled()
    },
    { timeout: 5000 },
  )
  await userEvent.type(canvas.getByTestId('secretKey'), MOCK_KEYPAIR.secretKey)

  await userEvent.click(
    canvas.getByRole('button', { name: /unlock responses/i }),
  )
}

const delightfulDashboardGrowthBook = new GrowthBook({
  features: { [featureFlags.delightfulDashboard]: { defaultValue: true } },
})

export const StorageFormUnlockedV2 = Template.bind({})
StorageFormUnlockedV2.parameters = StorageForm.parameters
// Asserting the v2 toolbar guards against a local v1 toggle in localStorage
// silently rendering v1 under this story's name.
StorageFormUnlockedV2.play = async (context) => {
  await StorageFormUnlocked.play?.(context)
  await within(context.canvasElement).findByRole('button', {
    name: /columns/i,
  })
}
StorageFormUnlockedV2.decorators = [
  (Story) => (
    <GrowthBookProvider growthbook={delightfulDashboardGrowthBook}>
      <Story />
    </GrowthBookProvider>
  ),
]

export const StorageFormLoading = Template.bind({})
StorageFormLoading.parameters = {
  msw: {
    handlers: {
      default: [
        ...createFormBuilderMocks(
          { responseMode: FormResponseMode.Encrypt },
          0,
        ),
        getAdminFormSubmissions({ delay: 'infinite' }),
        getStorageSubmissionMetadataResponse({}, 'infinite'),
        getUser(),
        getAdminFormCollaborators(),
      ],
    },
  },
}

export const MultiRespondentFormUnlocked = Template.bind({})
MultiRespondentFormUnlocked.parameters = {
  msw: {
    handlers: {
      default: [
        ...createFormBuilderMocks(
          {
            responseMode: FormResponseMode.Multirespondent,
            publicKey: MOCK_KEYPAIR.publicKey,
            workflow: [],
          },
          0,
        ),
        getAdminFormSubmissions({ override: 5 }),
        getMultiRespondentSubmissionMetadataResponse(),
        getUser(),
        getAdminFormCollaborators(),
      ],
    },
  },
}
MultiRespondentFormUnlocked.play = StorageFormUnlocked.play

const MOCK_SUBMISSION_ID = '62a8a7476f4f3e005bcd5ab7'

// Mirrors the app's routes so a response opens in the drawer over the table.
const DrawerTemplate: StoryFn = ({ responseNumber = 3 }) => {
  const router = createMemoryRouter(
    createRoutesFromElements(
      <Route path={`${ADMINFORM_ROUTE}/:formId`} element={<AdminFormLayout />}>
        <Route
          path={ADMINFORM_RESULTS_SUBROUTE}
          element={<FormResultsLayout />}
        >
          <Route element={<ResponsesLayout showResponses />}>
            <Route index />
            <Route
              path=":submissionId"
              element={<IndividualResponseDrawer />}
            />
          </Route>
        </Route>
      </Route>,
    ),
    {
      initialEntries: [
        {
          pathname: `${ADMINFORM_ROUTE}/61540ece3d4a6e50ac0cc6ff/${ADMINFORM_RESULTS_SUBROUTE}/${MOCK_SUBMISSION_ID}`,
          state: { responseNumber },
        },
      ],
    },
  )
  return <RouterProvider router={router} />
}

export const StorageFormResponseDrawer = DrawerTemplate.bind({})
StorageFormResponseDrawer.parameters = {
  argos: { modes: viewportModes('mobile') },
  // The router contains circular references, so skip automatic JSX serialization.
  docs: { source: { type: 'code', code: '<IndividualResponseDrawer />' } },
  msw: {
    handlers: {
      default: [
        ...createFormBuilderMocks(
          {
            responseMode: FormResponseMode.Encrypt,
            publicKey: MOCK_KEYPAIR.publicKey,
          },
          0,
        ),
        getAdminFormSubmissions(),
        getStorageSubmissionMetadataResponse(),
        getStorageSubmission({ publicKey: MOCK_KEYPAIR.publicKey }),
        getUser(),
        getAdminFormCollaborators(),
      ],
    },
  },
}
const responseDrawerGrowthBook = new GrowthBook({
  features: { [featureFlags.adminPrintPdf]: { defaultValue: true } },
})
StorageFormResponseDrawer.decorators = [
  (Story) => (
    <GrowthBookProvider growthbook={responseDrawerGrowthBook}>
      <Story />
    </GrowthBookProvider>
  ),
]
StorageFormResponseDrawer.play = StorageFormUnlocked.play

export const StorageFormResponseDrawerLongNumber = DrawerTemplate.bind({})
StorageFormResponseDrawerLongNumber.args = { responseNumber: 123456789 }
StorageFormResponseDrawerLongNumber.parameters =
  StorageFormResponseDrawer.parameters
StorageFormResponseDrawerLongNumber.decorators =
  StorageFormResponseDrawer.decorators
StorageFormResponseDrawerLongNumber.play = StorageFormUnlocked.play

export const Loading = Template.bind({})
Loading.parameters = {
  msw: {
    handlers: {
      default: [
        ...createFormBuilderMocks({ responseMode: undefined }, 'infinite'),
        getAdminFormSubmissions({ delay: 'infinite' }),
        getUser(),
        getAdminFormCollaborators(),
      ],
    },
  },
}
