import { Navigate, NavigateProps, useLocation } from 'react-router-dom'
import { Flex } from '@chakra-ui/react'

import { useAuth } from '~contexts/AuthContext'
import { LOGIN_ROUTE, ROOT_ROUTE } from '~constants/routes'
import GovtMasthead from '~components/GovtMasthead'

interface HashRouterElementProps {
  /**
   * If `strict` is true, only non-authed users can access the route.
   * i.e. signin page, where authed users accessing that page should be
   * redirected out.
   * If `strict` is false, then both authed and non-authed users can access
   * the route.
   * Defaults to `false`.
   */
  strict?: boolean

  /**
   * Route to redirect to when user is not authenticated. Defaults to
   * `LOGIN_ROUTE` if not provided.
   */
  redirectTo?: NavigateProps['to']

  element: React.ReactElement
}

type FormRegExpMatchArray = RegExpMatchArray & {
  groups: {
    formid?: string
  }
}

const hashRouteMapper = [
  {
    regex: /^#!\/(?<formid>[0-9a-fA-F]{24})$/,
    getTarget: (m: FormRegExpMatchArray) => `/${m.groups.formid}`,
  },
  {
    regex: /^#!\/(?<formid>[0-9a-fA-F]{24})\/admin$/,
    getTarget: (m: FormRegExpMatchArray) =>
      `${ROOT_ROUTE}/admin/form/${m.groups.formid}`,
  },
  {
    regex: /^#!\/(?<formid>[0-9a-fA-F]{24})\/preview$/,
    getTarget: (m: FormRegExpMatchArray) =>
      `${ROOT_ROUTE}/admin/form/${m.groups.formid}/preview`,
  },
  {
    regex: /^#!\/examples$/,
    getTarget: (m: FormRegExpMatchArray) => `${ROOT_ROUTE}/admin`,
  },
]

export const HashRouterElement = ({
  element,
  strict,
  redirectTo = LOGIN_ROUTE,
}: HashRouterElementProps): React.ReactElement => {
  const location = useLocation()
  const state = location.state as { from: Location } | undefined
  const { isAuthenticated } = useAuth()

  // Retire this custom routing after July 2024
  if (location.hash.startsWith('#!/')) {
    // angular routes that need to be mapped
    for (const { regex, getTarget } of hashRouteMapper) {
      const match = location.hash.match(regex)
      if (match) {
        redirectTo = getTarget(match as FormRegExpMatchArray)
        return <Navigate replace to={redirectTo} state={{ from: location }} />
      }
    }
  }

  if (isAuthenticated && strict) {
    return <Navigate to={state?.from.pathname ?? ROOT_ROUTE} replace />
  }

  return (
    <Flex flexDir="column" height="100vh" pos="relative">
      <GovtMasthead />
      {element}
    </Flex>
  )
}
