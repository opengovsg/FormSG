import {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useState,
} from 'react'
import { Portal } from '@chakra-ui/react'
import { AxiosError } from 'axios'

import { ApiService } from '~services/ApiService'

import TurnstileOverlayContainer from '~features/turnstile/TurnstileOverlay'

const TURNSTILE_SCRIPT_ID = 'turnstile-script-id'

declare global {
  interface Window {
    Turnstile: {
      setTurnstileVisible: (visible: boolean) => Promise<boolean>
      handleError: (error: AxiosError | null) => void
    }
  }
}
window.Turnstile = window.Turnstile || {}

export interface TurnstileContext {
  visible: boolean
  showTurnstile: (visible: boolean) => Promise<boolean>
  handleError?: (error: AxiosError | null) => void
}

export const TurnstileContext = createContext<TurnstileContext>({
  visible: false,
  showTurnstile: async (visible: boolean) => {
    return false
  },
  handleError: (error: AxiosError | null) => {
    console.error('Turnstile error:', error)
  },
})

export const useTurnstile = () => useContext(TurnstileContext)

export interface TurnstileProviderProps {
  props: TurnstileContext
}

export const TurnstileProvider = (
  props: PropsWithChildren<TurnstileProviderProps>,
) => {
  const [visible, setVisible] = useState(false)

  const state = {
    visible: visible,
    showTurnstile: async (visible: boolean) => {
      setVisible(visible)
      return visible
    },
    handleError: (error: AxiosError | null) => {
      return new Promise((resolve, reject) => {
        const originalRequestConfigToReplay = error ? { ...error.config } : null

        const onClose = () => {
          reject(
            new Error(
              'You must complete the security verification to continue. Please try again.',
            ),
          )
        }
        const onSuccess = () => {
          if (originalRequestConfigToReplay) {
            resolve(ApiService.request(originalRequestConfigToReplay))
          } else {
            reject(new Error('Something went wrong. Please try again.'))
          }
        }
        const onError = () => {
          reject(
            new Error(
              'Your verification was unsuccessful due to security reasons. Please try again.',
            ),
          )
        }
        const onLoadingError = () => {
          reject(
            new Error(
              'The security verification failed to load. Please try again.',
            ),
          )
        }

        setVisible(true)
      }).finally(() => {
        // setVisible(false)
      })
    },
  }

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.Turnstile = {
        setTurnstileVisible: state.showTurnstile,
        handleError: state.handleError,
      }
    }
    return () => {
      if (typeof window !== 'undefined') {
        // delete window.Turnstile
      }
    }
  }, [state.showTurnstile])

  return (
    <TurnstileContext.Provider value={state}>
      {props.children}
      {state.visible && (
        <Portal
          children={
            <TurnstileOverlayContainer
              onClose={() => setVisible(false)}
              onError={() => setVisible(false)}
              onSuccess={() => setVisible(false)}
              onLoadingError={() => setVisible(false)}
              turnstileScriptId={TURNSTILE_SCRIPT_ID}
            />
          }
        />
      )}
    </TurnstileContext.Provider>
  )
}
