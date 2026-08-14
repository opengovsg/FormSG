import { useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { useCreatePageSidebar } from './CreatePageSidebarContext'
import { OPEN_WORKFLOW_TAB_STATE } from './openWorkflowTabState'

/**
 * Opens the workflow tab when the create page is reached with
 * `OPEN_WORKFLOW_TAB_STATE`. Renders nothing; it exists to run this effect
 * inside `CreatePageSidebarProvider`.
 */
export const OpenWorkflowTabOnArrival = (): null => {
  const { state, pathname } = useLocation()
  const navigate = useNavigate()
  const { handleWorkflowClick } = useCreatePageSidebar()
  const hasOpened = useRef(false)

  useEffect(() => {
    // Once only. Re-running would fight the admin if they switch tabs.
    if (hasOpened.current) return
    if (!(state as typeof OPEN_WORKFLOW_TAB_STATE | null)?.openWorkflowTab) {
      return
    }

    hasOpened.current = true
    // Not pending: there is nothing unsaved to prompt about on arrival.
    handleWorkflowClick(false)

    // Drop the flag so a refresh or a back-navigation does not reopen the tab.
    navigate(pathname, { replace: true, state: null })
  }, [handleWorkflowClick, navigate, pathname, state])

  return null
}
