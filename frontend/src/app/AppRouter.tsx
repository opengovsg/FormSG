import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'

import {
  ADMINFORM_RESULTS_SUBROUTE,
  ADMINFORM_ROUTE,
  ADMINFORM_SETTINGS_SUBROUTE,
  LOGIN_ROUTE,
  PRIVACY_POLICY_ROUTE,
  PUBLICFORM_ROUTE,
  RESULTS_FEEDBACK_SUBROUTE,
  ROOT_ROUTE,
} from '~constants/routes'

import { AdminFormLayout } from '~features/admin-form/common/AdminFormLayout'
import { CreatePage } from '~features/admin-form/create/CreatePage'
import {
  FeedbackPage,
  FormResultsLayout,
  ResponsesPage,
} from '~features/admin-form/responses'
import { SettingsPage } from '~features/admin-form/settings/SettingsPage'

import { PrivateElement } from './PrivateElement'
import { PublicElement } from './PublicElement'

const PublicFormPage = lazy(
  () => import('~features/public-form/PublicFormPage'),
)
const WorkspacePage = lazy(() => import('~features/workspace'))
const LoginPage = lazy(() => import('~pages/login'))
const PrivacyPolicyPage = lazy(() => import('~pages/PrivacyPolicy'))

const WithSuspense = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<div>Loading...</div>}>{children}</Suspense>
)

export const AppRouter = (): JSX.Element => {
  return (
    <WithSuspense>
      <Routes>
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
          element={<PublicElement strict element={<PrivacyPolicyPage />} />}
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
            <Route index element={<ResponsesPage />} />
            <Route
              path={RESULTS_FEEDBACK_SUBROUTE}
              element={<FeedbackPage />}
            />
          </Route>
        </Route>
        <Route path="*" element={<div>404!!!</div>} />
      </Routes>
    </WithSuspense>
  )
}
