import { useState } from 'react'
import { useMutation } from 'react-query'

import { useInterval } from '~hooks/useInterval'
import Button from '~components/Button'
import { ButtonProps } from '~components/Button/Button'

export interface ResendOtpButtonProps extends ButtonProps {
  onResendOtp: () => Promise<void>
  /**
   * The timer to reset to once the otp has been resent.
   * Defaults to `60`.
   */
  timer?: number
}

export const ResendOtpButton = ({
  onResendOtp,
  timer: propTimer = 60,
  ...buttonProps
}: ResendOtpButtonProps): JSX.Element => {
  // The counter
  const [timer, setTimer] = useState(0)

  const resendOtpMutation = useMutation(onResendOtp, {
    // On success, restart the timer before this can be called again.
    onSuccess: () => setTimer(propTimer),
  })

  useInterval(
    () => setTimer(timer - 1),
    // Stop interval if timer hits 0.
    timer <= 0 ? null : 1000,
  )

  return (
    <Button
      isDisabled={resendOtpMutation.isLoading || timer > 0}
      isLoading={resendOtpMutation.isLoading}
      type="button"
      variant="clear"
      colorScheme="primary"
      onClick={() => resendOtpMutation.mutate()}
      {...buttonProps}
    >
      <u>
        Resend OTP
        {timer > 0 && ` in ${timer}s`}
      </u>
    </Button>
  )
}
