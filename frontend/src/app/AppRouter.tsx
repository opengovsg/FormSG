import { lazy, Suspense } from 'react'
import { Route, Switch } from 'react-router-dom'

import { LOGIN_ROUTE, ROOT_ROUTE } from '~constants/routes'

import { PrivateRoute } from './PrivateRoute'
import { PublicRoute } from './PublicRoute'

const WorkspacePage = lazy(() => import('~pages/workspace'))
const LoginPage = lazy(() => import('~pages/login'))

export const AppRouter = (): JSX.Element => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Switch>
        <PublicRoute exact path={LOGIN_ROUTE}>
          <LoginPage />
        </PublicRoute>
        <PrivateRoute exact path={ROOT_ROUTE}>
          <WorkspacePage />
        </PrivateRoute>
        <Route path="*">
          <div>404</div>
        </Route>
      </Switch>
    </Suspense>
  )
}
