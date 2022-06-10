import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'

import {
  ADMINFORM_RESULTS_SUBROUTE,
  ADMINFORM_ROUTE,
  ADMINFORM_SETTINGS_SUBROUTE,
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
import { CreatePage } from '~features/admin-form/create/CreatePage'
import {
  FeedbackPage,
  FormResultsLayout,
  ResponsesLayout,
  ResponsesPage,
} from '~features/admin-form/responses'
import { SettingsPage } from '~features/admin-form/settings/SettingsPage'

import { HashRouterElement } from './HashRouterElement'
import { PrivateElement } from './PrivateElement'
import { PublicElement } from './PublicElement'

const PublicFormPage = lazy(
  () => import('~features/public-form/PublicFormPage'),
)
const WorkspacePage = lazy(() => import('~features/workspace'))
const LandingPage = lazy(() => import('~pages/Landing'))
const LoginPage = lazy(() => import('~features/login'))
const PrivacyPolicyPage = lazy(() => import('~pages/PrivacyPolicy'))
const TermsOfUsePage = lazy(() => import('~pages/TermsOfUse'))

const WithSuspense = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<div>Loading...</div>}>{children}</Suspense>
)

export const AppRouter = (): JSX.Element => {
  // code here?
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
                element={<div>individual response page</div>}
              />
            </Route>
            <Route
              path={RESULTS_FEEDBACK_SUBROUTE}
              element={<FeedbackPage />}
            />
          </Route>
        </Route>
        <Route path="*" element={<NotFoundErrorPage />} />
      </Routes>
    </WithSuspense>
  )
}
