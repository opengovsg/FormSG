import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertProps,
  AlertTitle,
  Box,
  CloseButton,
  useMediaQuery,
  UseToastOptions,
} from '@chakra-ui/react'

type ToastStatus = 'danger' | 'success' | 'warning'

export interface ToastProps
  extends Omit<
    UseToastOptions,
    'duration' | 'position' | 'render' | 'status' | 'variant'
  > {
  /**
   * The status of the Toast.
   */
  status: ToastStatus
  // RenderProps that chakra passes to all custom components that uses the render function
  onClose: () => void
}

const getChakraAlertStatus = (status: ToastStatus): AlertProps['status'] =>
  status === 'danger' ? 'error' : status

export const Toast = ({
  status,
  title,
  id,
  description,
  isClosable,
  onClose,
  onCloseComplete,
}: ToastProps): JSX.Element => {
  // Dynamically determine the size of the modal based on screen breakpoints
  const [isDesktop] = useMediaQuery('(min-width: 1080px)')
  const width = isDesktop ? '680px' : 'auto'
  const horizontalMargins = isDesktop ? 'inherit' : 2

  return (
    <Alert
      status={getChakraAlertStatus(status)}
      variant="toast"
      colorScheme={status}
      padding={4}
      id={String(id)}
      // Padding right is 4 rem (normal padding) + width of the button.
      // This is to prevent the button overlapping the text on resize.
      pr={10}
      width={width}
      mx={horizontalMargins}
      mt={2}
    >
      <AlertIcon />
      <Box>
        {title && <AlertTitle>{title}</AlertTitle>}
        {description && (
          <AlertDescription display="block">{description}</AlertDescription>
        )}
      </Box>
      {isClosable && (
        <CloseButton
          position="absolute"
          right={4}
          top={4}
          size="sm"
          onClick={() => {
            if (onClose) {
              onClose()
            }
            if (onCloseComplete) {
              onCloseComplete()
            }
          }}
        />
      )}
    </Alert>
  )
}
