import Button from '~components/Button'

export interface ResendOtpButtonProps {
  timer: number
  isDisabled: boolean
  isLoading: boolean
  onButtonClick: () => void
}

// Exported for testing
export const ResendOtpButton = ({
  isDisabled,
  isLoading,
  onButtonClick,
  timer,
}: ResendOtpButtonProps): JSX.Element => {
  return (
    <Button
      isDisabled={isDisabled}
      isLoading={isLoading}
      onClick={onButtonClick}
      type="button"
      variant="reverse"
      colorScheme="primary"
    >
      Resend OTP
      {timer > 0 && ` in ${timer}s`}
    </Button>
  )
}
