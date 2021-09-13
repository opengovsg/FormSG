import { Redirect, Route, RouteProps, useLocation } from 'react-router-dom'
import { Location } from 'history'

import { useAuth } from '~contexts/AuthContext'
import { ROOT_ROUTE } from '~constants/routes'

export interface PublicRouteProps extends Omit<RouteProps, 'render'> {
  // If `strict` is true, only non-authed users can access the route.
  // i.e. signin page, where authed users accessing that page should be
  // redirected out.
  // If `strict` is false, then both authed and non-authed users can access
  // the route.
  strict?: boolean
}

export const PublicRoute = ({
  children,
  strict = true,
  ...rest
}: PublicRouteProps): JSX.Element => {
  const { isAuthenticated } = useAuth()

  const { state } = useLocation<{ from?: Location } | undefined>()

  return (
    <Route
      {...rest}
      render={({ location }) =>
        !!isAuthenticated && strict ? (
          <Redirect
            to={{
              pathname: state?.from?.pathname ?? ROOT_ROUTE,
              state: { from: location },
            }}
          />
        ) : (
          children
        )
      }
    />
  )
}
