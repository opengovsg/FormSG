import { Route } from 'react-router'
import {
  createMemoryRouter,
  createRoutesFromElements,
  RouterProvider,
} from 'react-router-dom'
import { Meta, StoryFn } from '@storybook/react'
import { expect, screen, userEvent, waitFor, within } from '@storybook/test'

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
import { getMobileViewParameters, viewports } from '~utils/storybook'

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
    // Required so skeleton "animation" does not hide content.
    chromatic: { pauseAnimationAtEnd: true },
    layout: 'fullscreen',
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

export const EmailFormTablet = Template.bind({})
EmailFormTablet.parameters = {
  viewport: {
    defaultViewport: 'tablet',
  },
  chromatic: { viewports: [viewports.md] },
}

export const EmailFormMobile = Template.bind({})
EmailFormMobile.parameters = getMobileViewParameters()

export const StorageForm = Template.bind({})
StorageForm.parameters = {
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

export const StorageFormUnlockedTablet = Template.bind({})
StorageFormUnlockedTablet.parameters = {
  ...EmailFormTablet.parameters,
  ...StorageFormUnlocked.parameters,
}
StorageFormUnlockedTablet.play = StorageFormUnlocked.play

export const StorageFormUnlockedMobile = Template.bind({})
StorageFormUnlockedMobile.parameters = {
  ...EmailFormMobile.parameters,
  ...StorageFormUnlocked.parameters,
}
StorageFormUnlockedMobile.play = StorageFormUnlocked.play

export const StorageFormTablet = Template.bind({})
StorageFormTablet.parameters = {
  ...EmailFormTablet.parameters,
  ...StorageForm.parameters,
}

export const StorageFormMobile = Template.bind({})
StorageFormMobile.parameters = {
  ...EmailFormMobile.parameters,
  ...StorageForm.parameters,
}

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
const DrawerTemplate: StoryFn = () => {
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
        `${ADMINFORM_ROUTE}/61540ece3d4a6e50ac0cc6ff/${ADMINFORM_RESULTS_SUBROUTE}/${MOCK_SUBMISSION_ID}`,
      ],
    },
  )
  return <RouterProvider router={router} />
}

export const StorageFormResponseDrawer = DrawerTemplate.bind({})
StorageFormResponseDrawer.parameters = {
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
// The drawer portals outside the canvas and its overlay blocks the table's
// input, so unlock through the last (drawer) secret-key input on the page.
const unlockFromDrawer: StoryFn['play'] = async () => {
  const lastSecretKeyInput = () => screen.getAllByTestId('secretKey').at(-1)

  await waitFor(
    async () => {
      expect(lastSecretKeyInput()).not.toBeDisabled()
    },
    { timeout: 5000 },
  )
  const input = lastSecretKeyInput()
  const unlockButton = screen
    .getAllByRole('button', { name: /unlock responses/i })
    .at(-1)
  if (!input || !unlockButton) throw new Error('Drawer secret-key form missing')

  await userEvent.type(input, MOCK_KEYPAIR.secretKey)
  await userEvent.click(unlockButton)
}
StorageFormResponseDrawer.play = unlockFromDrawer

export const StorageFormResponseDrawerMobile = DrawerTemplate.bind({})
StorageFormResponseDrawerMobile.parameters = {
  ...EmailFormMobile.parameters,
  ...StorageFormResponseDrawer.parameters,
}
StorageFormResponseDrawerMobile.play = unlockFromDrawer

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
