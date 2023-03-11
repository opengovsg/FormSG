import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useIntervalWhen } from 'rooks'

import { ButtonProps } from '~components/Button'

import { ResendOtpButton } from './ResendOtpButton'

export interface ResendOtpButtonContainerProps extends ButtonProps {
  onResendOtp: () => Promise<void>
  /**
   * The timer to reset to once the otp has been resent.
   * Defaults to `60`.
   */
  timer?: number
}

export const ResendOtpButtonContainer = ({
  onResendOtp,
  timer: propTimer = 60,
  ...buttonProps
}: ResendOtpButtonContainerProps): JSX.Element => {
  // The counter
  const [timer, setTimer] = useState(propTimer)

  const { isLoading, mutate } = useMutation(onResendOtp, {
    // On success, restart the timer before this can be called again.
    onSuccess: () => setTimer(propTimer),
  })

  useIntervalWhen(
    () => setTimer(timer - 1),
    /* intervalDurationMs= */ 1000,
    // Stop interval if timer hits 0.
    /* when= */ timer > 0,
  )

  return (
    <ResendOtpButton
      timer={timer}
      isDisabled={timer > 0}
      isLoading={isLoading}
      onButtonClick={mutate}
      {...buttonProps}
    />
  )
}
