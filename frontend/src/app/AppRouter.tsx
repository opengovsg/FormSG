import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import { Box } from '@chakra-ui/react'

import {
  ADMINFORM_PREVIEW_ROUTE,
  ADMINFORM_RESULTS_SUBROUTE,
  ADMINFORM_ROUTE,
  ADMINFORM_SETTINGS_SUBROUTE,
  ADMINFORM_USETEMPLATE_ROUTE,
  BILLING_ROUTE,
  DASHBOARD_ROUTE,
  LANDING_ROUTE,
  LOGIN_ROUTE,
  PRIVACY_POLICY_ROUTE,
  PUBLICFORM_ROUTE,
  RESULTS_FEEDBACK_SUBROUTE,
  TOU_ROUTE,
  USE_TEMPLATE_REDIRECT_SUBROUTE,
} from '~constants/routes'
import { fillHeightCss } from '~utils/fillHeightCss'
import { lazyRetry } from '~utils/lazyRetry'

import NotFoundErrorPage from '~pages/NotFoundError'
import { AdminFormLayout } from '~features/admin-form/common/AdminFormLayout'
import { CreatePage } from '~features/admin-form/create/CreatePage'
import {
  FeedbackPage,
  FormResultsLayout,
  IndividualResponsePage,
  ResponsesLayout,
  ResponsesPage,
} from '~features/admin-form/responses'
import { SettingsPage } from '~features/admin-form/settings/SettingsPage'
import { BillingPage } from '~features/user/billing'

import { HashRouterElement } from './HashRouterElement'
import { PrivateElement } from './PrivateElement'
import { PublicElement } from './PublicElement'

const UseTemplateRedirectPage = lazy(() => import('~pages/UseTemplateRedirect'))
const PublicFormPage = lazy(() =>
  lazyRetry(() => import('~features/public-form/PublicFormPage')),
)
const WorkspacePage = lazy(() => lazyRetry(() => import('~features/workspace')))
const LandingPage = lazy(() => lazyRetry(() => import('~pages/Landing')))
const LoginPage = lazy(() => lazyRetry(() => import('~features/login')))
const PrivacyPolicyPage = lazy(() =>
  lazyRetry(() => import('~pages/PrivacyPolicy')),
)
const TermsOfUsePage = lazy(() => lazyRetry(() => import('~pages/TermsOfUse')))
const PreviewFormPage = lazy(() =>
  lazyRetry(() => import('~features/admin-form/preview')),
)
const TemplateFormPage = lazy(() =>
  lazyRetry(() => import('~features/admin-form/template')),
)

const WithSuspense = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<Box bg="neutral.100" css={fillHeightCss} w="100vw" />}>
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
          path={DASHBOARD_ROUTE}
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
        <Route path={PUBLICFORM_ROUTE}>
          <Route
            index
            element={<PublicElement element={<PublicFormPage />} />}
          />
          <Route
            path={USE_TEMPLATE_REDIRECT_SUBROUTE}
            element={<PublicElement element={<UseTemplateRedirectPage />} />}
          />
        </Route>
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
        <Route
          path={`${ADMINFORM_ROUTE}/:formId/${ADMINFORM_USETEMPLATE_ROUTE}`}
          element={<PrivateElement element={<TemplateFormPage />} />}
        />
        <Route path="*" element={<NotFoundErrorPage />} />
      </Routes>
    </WithSuspense>
  )
}
