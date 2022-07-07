// https://github.com/remix-run/react-router/issues/8139#issuecomment-1023105785

import { ContextType, useContext, useEffect } from 'react'
import {
  Navigator as BaseNavigator,
  UNSAFE_NavigationContext as NavigationContext,
} from 'react-router-dom'
import { noop } from '@chakra-ui/utils'
import type { Blocker, History, Transition } from 'history'

interface Navigator extends BaseNavigator {
  block: History['block']
}

type NavigationContextWithBlock =
  | (ContextType<typeof NavigationContext> & {
      navigator?: Navigator
    })
  | null

/**
 * @source https://github.com/remix-run/react-router/commit/256cad70d3fd4500b1abcfea66f3ee622fb90874
 *
 * Blocks all navigation attempts. This is useful for preventing the page from
 * changing until some condition is met, like saving form data.
 */
export const useBlocker = (blocker: Blocker, when = true) => {
  const navigationContext = useContext(
    NavigationContext,
  ) as NavigationContextWithBlock

  useEffect(() => {
    if (!when) {
      return
    }

    if (navigationContext) {
      const unblock = navigationContext.navigator.block((tx: Transition) => {
        const autoUnblockingTx = {
          ...tx,
          retry() {
            // Automatically unblock the transition so it can play all the way
            // through before retrying it. TODO: Figure out how to re-enable
            // this block if the transition is cancelled for some reason.
            unblock()
            tx.retry()
          },
        }

        blocker(autoUnblockingTx)
      })
    } else {
      return noop
    }
  }, [blocker, when, navigationContext])
}
