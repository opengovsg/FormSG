import { useState } from 'react'

import { useIsMobile } from '~hooks/useIsMobile'

export const useSideNavCollapse = () => {
  const isMobile = useIsMobile()
  const [wantsCollapsed, setWantsCollapsed] = useState(false)
  return {
    isCollapsed: isMobile && wantsCollapsed,
    isMobile,
    toggle: () => setWantsCollapsed((value) => !value),
  }
}
