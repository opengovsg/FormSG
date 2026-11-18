import { useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'

export const PREVIEW_STEP_PARAM = 'step'

export const parsePreviewStep = (
  searchParams: URLSearchParams,
  stepCount: number,
): number => {
  const parsed = Number.parseInt(searchParams.get(PREVIEW_STEP_PARAM) ?? '', 10)
  if (Number.isNaN(parsed) || stepCount <= 0) return 0
  return Math.min(Math.max(parsed - 1, 0), stepCount - 1)
}

export const withPreviewStep = (
  searchParams: URLSearchParams,
  step: number,
): URLSearchParams => {
  const next = new URLSearchParams(searchParams)
  if (step === 0) {
    next.delete(PREVIEW_STEP_PARAM)
  } else {
    next.set(PREVIEW_STEP_PARAM, String(step + 1))
  }
  return next
}

export const usePreviewStep = (stepCount: number) => {
  const [searchParams, setSearchParams] = useSearchParams()
  const step = parsePreviewStep(searchParams, stepCount)
  const setStep = useCallback(
    (nextStep: number) =>
      setSearchParams((prev) => withPreviewStep(prev, nextStep), {
        replace: true,
      }),
    [setSearchParams],
  )
  return [step, setStep] as const
}

export const getPreviewStepLabel = (
  step: { step_name?: string },
  index: number,
): string => `Step ${index + 1}${step.step_name ? `: ${step.step_name}` : ''}`
