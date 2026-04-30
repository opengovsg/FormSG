import { useEffect } from 'react'

import { useSessionStorage } from '~hooks/useSessionStorage'

export const USE_TEMPLATE_WALL_SESSION_KEY_PREFIX =
  'has-seen-use-template-wall-'

interface UseTemplateWallScrollTriggerProps {
  formId: string
  onTrigger: () => void
}

/**
 * Headless component: watches window scroll and calls `onTrigger` once per
 * session per form when the user has scrolled at least 1.5 viewport heights.
 * Renders nothing.
 */
export const UseTemplateWallScrollTrigger = ({
  formId,
  onTrigger,
}: UseTemplateWallScrollTriggerProps): null => {
  const [hasSeen, setHasSeen] = useSessionStorage<boolean>(
    `${USE_TEMPLATE_WALL_SESSION_KEY_PREFIX}${formId}`,
    false,
  )

  useEffect(() => {
    if (hasSeen) return
    const onScroll = () => {
      const scrollTop =
        window.scrollY ||
        document.documentElement.scrollTop ||
        document.body.scrollTop ||
        0
      if (scrollTop >= window.innerHeight * 0.75) {
        setHasSeen(true)
        onTrigger()
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    document.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      document.removeEventListener('scroll', onScroll)
    }
  }, [hasSeen, onTrigger, setHasSeen])

  return null
}
