// Hook to load the reCAPTCHA script.
// No other package works for our enterprise use case, so this hook is written with reference from
// https://github.com/tomliangg/react-hook-recaptcha,
// https://github.com/sarneeh/reaptcha, and
// https://github.com/dozoisch/react-google-recaptcha.
import { useCallback, useEffect, useRef, useState } from 'react'
import { useInterval } from '@chakra-ui/react'

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
  onChange?: (response: string | null) => void
  onExpiry?: () => void
  onError?: () => void
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

export const useRecaptcha = ({
  id: containerId = DEFAULT_CONTAINER_ID,
  sitekey,
  theme,
  onChange,
  onExpiry,
  onError,
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

  const executionPromise = useRef<GreptchaExecutionCallback>({})

  useInterval(
    () => {
      if (grecaptcha?.render) {
        setHasLoaded(true)
      }
    },
    // Do not even start if sitekey is not provided
    !sitekey || hasLoaded ? null : 500,
  )

  const handleChange = useCallback(
    (response: string | null) => {
      onChange?.(response)
      if (executionPromise.current.resolve) {
        executionPromise.current.resolve(response)
        executionPromise.current = {}
      }
    },
    [onChange],
  )

  const handleError = useCallback(() => {
    onError?.()
    if (executionPromise.current?.reject) {
      executionPromise.current.reject()
      executionPromise.current = {}
    }
  }, [onError])

  const handleExpiry = useCallback(() => {
    grecaptcha?.reset(widgetId)
    if (onExpiry) {
      onExpiry()
    } else {
      handleChange(null)
    }
  }, [grecaptcha, handleChange, onExpiry, widgetId])

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
   */
  const getCaptchaResponse = useCallback(async () => {
    if (!grecaptcha || widgetId === undefined) return Promise.resolve(null)

    return new Promise<string | null>((resolve, reject) => {
      executionPromise.current = { resolve, reject }
      return grecaptcha.execute(widgetId)
    })
  }, [grecaptcha, widgetId])

  return {
    hasLoaded,
    getCaptchaResponse,
    containerId,
  }
}
