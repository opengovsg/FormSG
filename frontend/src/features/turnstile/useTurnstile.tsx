import { useCallback, useEffect, useRef, useState } from 'react'
import { useIntervalWhen } from 'rooks'

import { featureFlags } from '~shared/constants'

import { useScript } from '~hooks/useScript'

import { useFeatureFlagWithDefaults } from '~features/feature-flags/queries'

type TurnstileBaseConfig = {
  sitekey?: string
  theme?: 'light' | 'dark' | 'auto'
  size?: 'normal' | 'compact'
  tabindex?: number
  language?: string
  execution?: 'default' | 'execute'
  appearance?: 'always' | 'execute' | 'interaction-only'
}

interface UseTurnstileProps extends TurnstileBaseConfig {
  // id of container to load Turnstile captcha in.
  containerID?: string
}

type TurnstileConfig = TurnstileBaseConfig & {
  callback?: (token: string) => void
  'expired-callback'?: () => void
  'error-callback'?: () => void
}

type TurnstileCallbacks = {
  ready: (callback: () => void) => void
  render: (containerID?: string, config?: TurnstileConfig) => string
  reset: (widgetID: string | undefined) => void
  execute: (widgetID: string) => void
  getResponse: (widgetID: string) => string
}

declare global {
  interface Window {
    turnstile?: TurnstileCallbacks
  }
}

// todo: check usages
type TurnstileExecutionCallback = {
  resolve?: (response: string | null) => void
  reject?: (reason?: unknown) => void
}

const DEFAULT_CONTAINER_ID = 'turnstile-container'

// todo: check usages
export class TurnstileClosedError extends Error {
  constructor() {
    super('Captcha was closed')
  }
}

export const useTurnstile = ({
  containerID = DEFAULT_CONTAINER_ID,
  sitekey,
  execution = 'execute',
  theme = 'light',
  appearance = 'interaction-only',
}: UseTurnstileProps) => {
  useScript(
    'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit',
  )
  const turnstile: TurnstileCallbacks | undefined = window.turnstile
  const [hasLoaded, setHasLoaded] = useState(turnstile?.render ? true : false)
  const [widgetID, setWidgetID] = useState<string>()

  const executionPromise = useRef<TurnstileExecutionCallback>({})

  // Feature flag to control turnstile captcha rollout
  // defaults to false
  // todo: remove after full rollout
  const enableTurnstileFeatureFlag = useFeatureFlagWithDefaults(
    featureFlags.turnstile,
    true,
  )

  useIntervalWhen(
    () => {
      if (turnstile?.render) {
        setHasLoaded(true)
      }
    },
    500,
    !!sitekey && !hasLoaded,
  )

  const handleChange = useCallback((response: string | null) => {
    if (executionPromise.current.resolve) {
      executionPromise.current.resolve(response)
      executionPromise.current = {}
    }
    // setIsVfnInProgress(false)
  }, [])

  const handleError = useCallback(() => {
    if (executionPromise.current?.reject) {
      executionPromise.current.reject()
      executionPromise.current = {}
    }
  }, [])

  const handleExpiry = useCallback(() => {
    turnstile?.reset(widgetID)
    handleChange(null)
  }, [turnstile, handleChange, widgetID])

  useEffect(() => {
    if (sitekey && hasLoaded && widgetID === undefined) {
      const renderProps = {
        sitekey,
        execution,
        theme,
        appearance,
        callback: handleChange,
        'expired-callback': handleExpiry,
        'error-callback': handleError,
      }
      if (enableTurnstileFeatureFlag) {
        const widget = turnstile?.render('#' + containerID, renderProps)
        setWidgetID(widget)
      }
    }
  }, [
    hasLoaded,
    widgetID,
    containerID,
    enableTurnstileFeatureFlag,
    sitekey,
    appearance,
    execution,
    theme,
    handleChange,
    handleExpiry,
    handleError,
    turnstile,
  ])

  const getTurnstileResponse = useCallback(async () => {
    if (!turnstile || widgetID === undefined) return Promise.resolve(null)
    turnstile.reset(widgetID)
    // setIsVfnInProgress(true)

    return new Promise<string | null>((resolve, reject) => {
      executionPromise.current = { resolve, reject }
      turnstile.execute(widgetID)
    })
  }, [turnstile, widgetID])

  return {
    hasLoaded,
    getTurnstileResponse,
    containerID,
  }
}
