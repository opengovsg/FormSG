// Hook to load the reCAPTCHA script.
// No other package works for our enterprise use case, so this hook is written with reference from
// https://github.com/tomliangg/react-hook-recaptcha,
// https://github.com/sarneeh/reaptcha, and
// https://github.com/dozoisch/react-google-recaptcha.
import { useCallback, useEffect, useRef, useState } from 'react'
import get from 'lodash/get'
import { useIntervalWhen } from 'rooks'

import { useScript } from '~hooks/useScript'

type RecaptchaBaseConfig = {
  sitekey?: string
  theme?: 'light' | 'dark'
  size?: 'compact' | 'normal' | 'invisible'
  badge?: 'bottomright' | 'bottomleft' | 'inline'
  tabindex?: number
  hl?: string
  isolated?: boolean
}

interface UseRecaptchaProps extends RecaptchaBaseConfig {
  /** id of container to load reCaptcha in. If not provided, one will be generated */
  id?: string
  useRecaptchaNet?: boolean
  useEnterprise?: boolean
}

type RecaptchaConfig = RecaptchaBaseConfig & {
  callback?: (response: string) => void
  'expired-callback'?: () => void
  'error-callback'?: () => void
}

type GrecaptchaCallbacks = {
  ready: (callback: () => void) => void
  render: (container?: string, config?: RecaptchaConfig) => number
  reset: (id?: number) => void
  execute: (id?: number) => void
  getResponse: (id?: number) => string
}

export type Grecaptcha = GrecaptchaCallbacks & {
  enterprise: GrecaptchaCallbacks
}

declare global {
  interface Window {
    grecaptcha?: Grecaptcha
  }
}

const getRecaptchaUrl = ({
  useEnterprise,
  useRecaptchaNet,
}: Pick<UseRecaptchaProps, 'useEnterprise' | 'useRecaptchaNet'>) => {
  const hostname = useRecaptchaNet ? 'recaptcha.net' : 'www.google.com'
  return `https://${hostname}/recaptcha/${
    useEnterprise ? 'enterprise' : 'api'
  }.js?render=explicit`
}

type GreptchaExecutionCallback = {
  resolve?: (response: string | null) => void
  reject?: (reason?: unknown) => void
}

const DEFAULT_CONTAINER_ID = 'recaptcha-container'

export class RecaptchaClosedError extends Error {
  constructor() {
    super('Recaptcha was closed')
  }
}

export const useRecaptcha = ({
  id: containerId = DEFAULT_CONTAINER_ID,
  sitekey,
  theme,
  useEnterprise = true,
  badge = 'inline',
  size = 'invisible',
  useRecaptchaNet,
}: UseRecaptchaProps) => {
  useScript(getRecaptchaUrl({ useEnterprise, useRecaptchaNet }))

  const grecaptcha: GrecaptchaCallbacks | undefined = useEnterprise
    ? window.grecaptcha?.enterprise
    : window.grecaptcha

  const [hasLoaded, setHasLoaded] = useState(grecaptcha?.render ? true : false)
  const [widgetId, setWidgetId] = useState<number>()
  const [isVfnInProgress, setIsVfnInProgress] = useState(false)
  const [hasDisplayed, setHasDisplayed] = useState(false)

  const executionPromise = useRef<GreptchaExecutionCallback>({})

  const captchaRef = useRef<HTMLDivElement | null>(null)

  useIntervalWhen(
    () => {
      if (grecaptcha?.render) {
        setHasLoaded(true)
      }
    },
    /* intervalDurationMs= */ 500,
    // Start only if sitekey is provided and has not loaded.
    /** when= */ !!sitekey && !hasLoaded,
  )

  const handleChange = useCallback((response: string | null) => {
    if (executionPromise.current.resolve) {
      executionPromise.current.resolve(response)
      executionPromise.current = {}
    }
    setIsVfnInProgress(false)
  }, [])

  const handleError = useCallback(() => {
    if (executionPromise.current?.reject) {
      executionPromise.current.reject()
      executionPromise.current = {}
    }
    setIsVfnInProgress(false)
    setHasDisplayed(false)
  }, [])

  const handleExpiry = useCallback(() => {
    grecaptcha?.reset(widgetId)
    handleChange(null)
    setIsVfnInProgress(false)
    setHasDisplayed(false)
  }, [grecaptcha, handleChange, widgetId])

  // Poll to check if recaptcha window has closed and display error accordingly.
  useIntervalWhen(
    () => {
      const iframes = document.querySelectorAll(
        'iframe[src*="recaptcha/enterprise/bframe"]',
      )
      if (iframes.length === 0) return
      const recaptchaVisibility = get(
        iframes[0].parentNode?.parentNode,
        'style.visibility',
      )
      if (isVfnInProgress && recaptchaVisibility === 'visible') {
        // Recaptcha now shown
        setHasDisplayed(true)
        return
      }
      if (isVfnInProgress && recaptchaVisibility === 'hidden' && hasDisplayed) {
        executionPromise.current.reject?.(new RecaptchaClosedError())
        setIsVfnInProgress(false)
        setHasDisplayed(false)
      }
    },
    /* intervalDurationMs= */ 100,
    /* when= */ isVfnInProgress,
  )

  useEffect(() => {
    if (sitekey && hasLoaded && widgetId === undefined) {
      const renderProps = {
        sitekey,
        size,
        theme,
        badge,
        callback: handleChange,
        'expired-callback': handleExpiry,
        'error-callback': handleError,
      }
      const widget = grecaptcha?.render(containerId, renderProps)
      setWidgetId(widget)
    }
  }, [
    hasLoaded,
    widgetId,
    containerId,
    sitekey,
    size,
    theme,
    badge,
    handleChange,
    handleExpiry,
    handleError,
    useEnterprise,
    grecaptcha,
  ])

  /**
   * Executes reCAPTCHA asynchronously.
   * @returns captcha response if available, null if not instantiated.
   * @throws RecaptchaClosedError if recaptcha window is closed before successfully completing recaptcha.
   */
  const getCaptchaResponse = useCallback(async () => {
    if (!grecaptcha || widgetId === undefined) return Promise.resolve(null)
    // Always reset before verifying again, or execute will never return.
    grecaptcha.reset(widgetId)

    setIsVfnInProgress(true)

    return new Promise<string | null>((resolve, reject) => {
      executionPromise.current = { resolve, reject }
      return grecaptcha.execute(widgetId)
    })
  }, [grecaptcha, widgetId])

  return {
    hasLoaded,
    getCaptchaResponse,
    containerId,
    captchaRef,
  }
}
