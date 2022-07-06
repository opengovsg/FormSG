import { Outlet } from 'react-router-dom'

import { ResponsesTabWrapper } from './common/ResponsesTabWrapper'
import { UnlockedResponsesProvider } from './storage/UnlockedResponses'

/**
 * Page for rendering subroutes via `Outlet` component for admin form result responses pages.
 */
export const ResponsesLayout = (): JSX.Element => {
  return (
    <ResponsesTabWrapper>
      <UnlockedResponsesProvider>
        <Outlet />
      </UnlockedResponsesProvider>
    </ResponsesTabWrapper>
  )
}
