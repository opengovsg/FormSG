import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import { Box } from '@chakra-ui/react'

import {
  ADMINFORM_PREVIEW_ROUTE,
  ADMINFORM_RESULTS_SUBROUTE,
  ADMINFORM_ROUTE,
  ADMINFORM_SETTINGS_SUBROUTE,
  BILLING_ROUTE,
  LANDING_ROUTE,
  LOGIN_ROUTE,
  PRIVACY_POLICY_ROUTE,
  PUBLICFORM_ROUTE,
  RESULTS_FEEDBACK_SUBROUTE,
  ROOT_ROUTE,
  TOU_ROUTE,
} from '~constants/routes'

import NotFoundErrorPage from '~pages/NotFoundError'
import { AdminFormLayout } from '~features/admin-form/common/AdminFormLayout'
import {
  FormResultsLayout,
  IndividualResponsePage,
  ResponsesLayout,
} from '~features/admin-form/responses'

import { HashRouterElement } from './HashRouterElement'
import { PrivateElement } from './PrivateElement'
import { PublicElement } from './PublicElement'

const FeedbackPage = lazy(
  () => import('~features/admin-form/responses/FeedbackPage/FeedbackPage'),
)
const ResponsesPage = lazy(
  () => import('~features/admin-form/responses/ResponsesPage/ResponsesPage'),
)
const SettingsPage = lazy(
  () => import('~features/admin-form/settings/SettingsPage'),
)
const BillingPage = lazy(() => import('~features/user/billing'))
const CreatePage = lazy(() => import('~features/admin-form/create/CreatePage'))
const PublicFormPage = lazy(
  () => import('~features/public-form/PublicFormPage'),
)
const WorkspacePage = lazy(() => import('~features/workspace'))
const LandingPage = lazy(() => import('~pages/Landing'))
const LoginPage = lazy(() => import('~features/login'))
const PrivacyPolicyPage = lazy(() => import('~pages/PrivacyPolicy'))
const TermsOfUsePage = lazy(() => import('~pages/TermsOfUse'))
const PreviewFormPage = lazy(() => import('~features/admin-form/preview'))

const WithSuspense = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<Box bg="neutral.100" h="100vh" w="100vw" />}>
    {children}
  </Suspense>
)

export const AppRouter = (): JSX.Element => {
  return (
    <WithSuspense>
      <Routes>
        <Route
          path={LANDING_ROUTE}
          element={<HashRouterElement element={<LandingPage />} />}
        />
        <Route
          path={ROOT_ROUTE}
          element={<PrivateElement element={<WorkspacePage />} />}
        />
        <Route
          path={LOGIN_ROUTE}
          element={<PublicElement strict element={<LoginPage />} />}
        />
        <Route
          path={PRIVACY_POLICY_ROUTE}
          element={<PublicElement element={<PrivacyPolicyPage />} />}
        />
        <Route
          path={TOU_ROUTE}
          element={<PublicElement element={<TermsOfUsePage />} />}
        />
        <Route
          path={BILLING_ROUTE}
          element={<PrivateElement element={<BillingPage />} />}
        />
        <Route
          path={PUBLICFORM_ROUTE}
          element={<PublicElement element={<PublicFormPage />} />}
        />
        <Route
          path={`${ADMINFORM_ROUTE}/:formId`}
          element={<PrivateElement element={<AdminFormLayout />} />}
        >
          <Route index element={<CreatePage />} />
          <Route
            path={ADMINFORM_SETTINGS_SUBROUTE}
            element={<SettingsPage />}
          />
          <Route
            path={ADMINFORM_RESULTS_SUBROUTE}
            element={<FormResultsLayout />}
          >
            <Route element={<ResponsesLayout />}>
              <Route index element={<ResponsesPage />} />
              <Route
                path=":submissionId"
                element={<IndividualResponsePage />}
              />
            </Route>
            <Route
              path={RESULTS_FEEDBACK_SUBROUTE}
              element={<FeedbackPage />}
            />
          </Route>
        </Route>
        <Route
          path={`${ADMINFORM_ROUTE}/:formId/${ADMINFORM_PREVIEW_ROUTE}`}
          element={<PrivateElement element={<PreviewFormPage />} />}
        />
        <Route path="*" element={<NotFoundErrorPage />} />
      </Routes>
    </WithSuspense>
  )
}
