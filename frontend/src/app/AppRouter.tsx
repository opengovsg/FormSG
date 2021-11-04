/* eslint-disable @typescript-eslint/no-unused-vars */
import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'

import {
  ADMIN_FORM_ROUTE,
  LOGIN_ROUTE,
  PUBLIC_FORM_REGEX,
  ROOT_ROUTE,
} from '~constants/routes'

import { AdminFormPage } from '~features/admin-form/common/AdminFormPage'
import { PublicFormPage } from '~features/public-form/PublicFormPage'

import { PrivateElement } from './PrivateElement'
import { PublicElement } from './PublicElement'

const WorkspacePage = lazy(() => import('~features/workspace'))
const LoginPage = lazy(() => import('~pages/login'))

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
          path={PUBLIC_FORM_REGEX}
          element={<PublicElement element={<PublicFormPage />} />}
        />
        <Route
          path={`${ADMIN_FORM_ROUTE}/:formId`}
          element={<PrivateElement element={<AdminFormPage />} />}
        />
        <Route path="*">
          <div>404</div>
        </Route>
      </Routes>
    </WithSuspense>
  )
}
