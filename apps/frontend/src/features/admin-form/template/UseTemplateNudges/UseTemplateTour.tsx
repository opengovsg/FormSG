import { useEffect, useMemo, useState } from 'react'
import Joyride from 'react-joyride'
import { useToken } from '@chakra-ui/react'

import { getUseTemplateTourSteps } from './UseTemplateTour.constants'
import { UseTemplateTourTooltip } from './UseTemplateTourTooltip'

// Must match the topOffset used by the sentinel Waypoint in
// PreviewFormBannerContainer so the tour re-targets exactly when the sticky
// banner slides in.
const STICKY_ACTIVATION_OFFSET_PX = 64

export const UseTemplateTour = (): JSX.Element => {
  const [arrowColor] = useToken('colors', ['primary.100'])
  const [stickyActive, setStickyActive] = useState(false)

  useEffect(() => {
    const onScroll = () => {
      const scrollTop =
        window.scrollY ||
        document.documentElement.scrollTop ||
        document.body.scrollTop ||
        0
      setStickyActive(scrollTop > STICKY_ACTIVATION_OFFSET_PX)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    document.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      document.removeEventListener('scroll', onScroll)
    }
  }, [])

  const steps = useMemo(
    () => getUseTemplateTourSteps(stickyActive),
    [stickyActive],
  )

  return (
    <Joyride
      // Force remount on target switch so Joyride re-queries the DOM and
      // re-anchors the tooltip to whichever banner is currently visible.
      key={stickyActive ? 'sticky' : 'main'}
      steps={steps}
      continuous
      run
      hideBackButton
      disableOverlay
      disableScrolling
      floaterProps={{
        placement: 'bottom-end',
        styles: {
          arrow: {
            length: 8,
            spread: 16,
          },
          floaterWithAnimation: {
            transition: 'opacity 0.3s ease 0s, transform 0s ease 0s',
          },
        },
      }}
      styles={{
        options: {
          arrowColor: arrowColor,
        },
      }}
      spotlightPadding={3}
      tooltipComponent={UseTemplateTourTooltip}
    />
  )
}
