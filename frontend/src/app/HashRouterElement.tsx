import { useLocation } from 'react-router-dom'

import { DASHBOARD_ROUTE } from '~constants/routes'

import { PublicElement } from './PublicElement'

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
    getTarget: (m: FormRegExpMatchArray) => `/admin/form/${m.groups.formid}`,
  },
  {
    regex: /^#!\/(?<formid>[0-9a-fA-F]{24})\/preview$/,
    getTarget: (m: FormRegExpMatchArray) =>
      `/admin/form/${m.groups.formid}/preview`,
  },
  {
    regex: /^#!\/forms$/,
    getTarget: (m: FormRegExpMatchArray) => `${DASHBOARD_ROUTE}`,
  },
  {
    regex: /^#!\/examples$/,
    getTarget: (m: FormRegExpMatchArray) => `/examples`,
  },
]

export const HashRouterElement = ({
  element,
  strict = false,
}: HashRouterElementProps): React.ReactElement => {
  const location = useLocation()

  // Retire this custom routing after July 2024
  if (location.hash.startsWith('#!/')) {
    // angular routes that need to be mapped
    for (const { regex, getTarget } of hashRouteMapper) {
      const match = location.hash.match(regex)
      if (match) {
        const redirectTo = getTarget(match as FormRegExpMatchArray)
        window.location.assign(redirectTo)
      }
    }
  }

  return <PublicElement element={element} strict={strict} />
}
