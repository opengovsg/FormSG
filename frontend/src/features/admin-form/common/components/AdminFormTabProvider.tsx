import { useCallback, useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { Tabs, useBreakpointValue } from '@chakra-ui/react'

import { ADMIN_FORM_ROUTE } from '~constants/routes'

interface AdminFormTabProviderProps {
  children: React.ReactNode
}

export const AdminFormTabProvider = ({
  children,
}: AdminFormTabProviderProps): JSX.Element => {
  const { formId } = useParams()
  const navigate = useNavigate()
  const { pathname } = useLocation()

  const routes = useMemo(() => {
    const baseRoute = `${ADMIN_FORM_ROUTE}/${formId}`
    return [baseRoute, `${baseRoute}/settings`, `${baseRoute}/responses`]
  }, [formId])

  const defaultIndex = useMemo(() => {
    const index = routes.findIndex((r) => r === pathname)
    return index === -1 ? 0 : index
  }, [pathname, routes])

  const [tabIndex, setTabIndex] = useState(defaultIndex)

  const handleTabsChange = useCallback(
    (index: number) => {
      setTabIndex(index)
      navigate(routes[index])
    },
    [navigate, routes],
  )

  const responsiveVariant = useBreakpointValue({
    base: 'line-dark',
    xs: 'line-dark',
    lg: 'line-light',
  })

  return (
    <Tabs
      variant={responsiveVariant}
      isLazy
      defaultIndex={defaultIndex}
      index={tabIndex}
      onChange={handleTabsChange}
    >
      {children}
    </Tabs>
  )
}
