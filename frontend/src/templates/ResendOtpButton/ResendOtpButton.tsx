import { useState } from 'react'
import { useMutation } from 'react-query'
import { Text } from '@chakra-ui/react'
import { Button } from '@opengovsg/design-system-react'
import { useIntervalWhen } from 'rooks'

import { ButtonProps } from '~components/Button'

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
    <Button
      isDisabled={timer > 0}
      isLoading={isLoading}
      onClick={() => mutate()}
      type="button"
      variant="reverse"
      colorScheme="primary"
      {...buttonProps}
    >
      Resend OTP
      <Text as="span" data-chromatic="ignore">
        {timer > 0 && ` in ${timer}s`}
      </Text>
    </Button>
  )
}
