import { useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { useCreatePageSidebar } from './CreatePageSidebarContext'

export const OPEN_WORKFLOW_TAB_STATE = { openWorkflowTab: true } as const

export const OpenWorkflowTabOnArrival = (): null => {
  const { state, pathname } = useLocation()
  const navigate = useNavigate()
  const { handleWorkflowClick } = useCreatePageSidebar()
  const hasOpened = useRef(false)

  useEffect(() => {
    if (hasOpened.current) return
    if (!(state as typeof OPEN_WORKFLOW_TAB_STATE | null)?.openWorkflowTab) {
      return
    }

    hasOpened.current = true
    handleWorkflowClick(false)

    navigate(pathname, { replace: true, state: null })
  }, [handleWorkflowClick, navigate, pathname, state])

  return null
}
