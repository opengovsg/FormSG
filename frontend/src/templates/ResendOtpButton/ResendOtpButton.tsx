import Button, { ButtonProps } from '~components/Button'

export interface ResendOtpButtonProps extends ButtonProps {
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
  ...buttonProps
}: ResendOtpButtonProps): JSX.Element => {
  return (
    <Button
      isDisabled={isDisabled}
      isLoading={isLoading}
      onClick={onButtonClick}
      type="button"
      variant="reverse"
      colorScheme="primary"
      {...buttonProps}
    >
      Resend OTP
      {timer > 0 && ` in ${timer}s`}
    </Button>
  )
}
