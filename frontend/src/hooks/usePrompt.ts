// https://github.com/remix-run/react-router/issues/8139#issuecomment-1023105785

import { useCallback } from 'react'
import type { Transition } from 'history'

import { useBlocker } from './useBlocker'

/**
 * @source https://github.com/remix-run/react-router/issues/8139#issuecomment-1021457943
 *
 * Prompts the user with a window alert before they leave the current screen.
 */
export const usePrompt = (
  message:
    | string
    | ((
        location: Transition['location'],
        action: Transition['action'],
      ) => string),
  when = true,
) => {
  const blocker = useCallback(
    (tx: Transition) => {
      let response
      if (typeof message === 'function') {
        response = message(tx.location, tx.action)
        if (typeof response === 'string') {
          response = window.confirm(response)
        }
      } else {
        response = window.confirm(message)
      }
      if (response) {
        tx.retry()
      }
    },
    [message],
  )
  return useBlocker(blocker, when)
}
