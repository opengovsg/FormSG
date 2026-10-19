import { useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { OpenFieldListTabState } from '../builder-and-design/constants'

import { useCreatePageSidebar } from './CreatePageSidebarContext'

export const OpenFieldListTabOnArrival = (): null => {
  const { state, pathname } = useLocation()
  const navigate = useNavigate()
  const { handleBuilderClick, setFieldListTabIndex } = useCreatePageSidebar()
  const hasOpened = useRef(false)

  useEffect(() => {
    if (hasOpened.current) return
    const tab = (state as OpenFieldListTabState | null)?.openFieldListTab
    if (tab === undefined) return

    hasOpened.current = true
    setFieldListTabIndex(tab)
    handleBuilderClick(false)

    navigate(pathname, { replace: true, state: null })
  }, [handleBuilderClick, navigate, pathname, setFieldListTabIndex, state])

  return null
}
