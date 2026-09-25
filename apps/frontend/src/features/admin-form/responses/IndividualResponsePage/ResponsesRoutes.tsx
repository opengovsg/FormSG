import { useIsDelightfulDashboard } from '../hooks'
import { ResponsesPage } from '../ResponsesPage'

import { IndividualResponseDrawer } from './IndividualResponseDrawer'
import { IndividualResponsePage } from './IndividualResponsePage'

export const ResponsesIndexRoute = (): JSX.Element | null => {
  const isDelightfulDashboard = useIsDelightfulDashboard()
  return isDelightfulDashboard ? null : <ResponsesPage />
}

export const IndividualResponseRoute = (): JSX.Element => {
  const isDelightfulDashboard = useIsDelightfulDashboard()
  return isDelightfulDashboard ? (
    <IndividualResponseDrawer />
  ) : (
    <IndividualResponsePage />
  )
}
