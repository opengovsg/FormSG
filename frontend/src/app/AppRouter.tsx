import { lazy, Suspense } from 'react'
import { BrowserRouter, Route, Switch } from 'react-router-dom'

import { ADMIN_FORM_ROUTE, LOGIN_ROUTE, ROOT_ROUTE } from '~constants/routes'

import { AdminFormPage } from '~features/admin-form/common/AdminFormPage'

import { PrivateRoute } from './PrivateRoute'
import { PublicRoute } from './PublicRoute'

const WorkspacePage = lazy(() => import('~features/workspace'))
const LoginPage = lazy(() => import('~pages/login'))

export const AppRouter = (): JSX.Element => {
  return (
    <BrowserRouter>
      <Suspense fallback={<div>Loading...</div>}>
        <Switch>
          <PublicRoute exact path={LOGIN_ROUTE}>
            <LoginPage />
          </PublicRoute>
          <PrivateRoute exact path={ROOT_ROUTE}>
            <WorkspacePage />
          </PrivateRoute>
          <PrivateRoute path={`${ADMIN_FORM_ROUTE}/:formId`}>
            <AdminFormPage />
          </PrivateRoute>
          <Route path="*">
            <div>404</div>
          </Route>
        </Switch>
      </Suspense>
    </BrowserRouter>
  )
}
