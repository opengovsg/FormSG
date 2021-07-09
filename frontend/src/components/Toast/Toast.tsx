import { BiX } from 'react-icons/bi'
import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertProps,
  AlertTitle,
  Box,
  CloseButton,
  useMultiStyleConfig,
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
  const styles = useMultiStyleConfig('Toast', {})

  return (
    <Alert
      sx={styles.alert}
      status={getChakraAlertStatus(status)}
      variant="toast"
      colorScheme={status}
      id={String(id)}
    >
      <AlertIcon />
      <Box>
        {title && <AlertTitle>{title}</AlertTitle>}
        {description && <AlertDescription>{description}</AlertDescription>}
      </Box>
      {isClosable && (
        <CloseButton
          children={<BiX />}
          onClick={() => {
            onClose?.()
            onCloseComplete?.()
          }}
          sx={styles.close}
        />
      )}
    </Alert>
  )
}
