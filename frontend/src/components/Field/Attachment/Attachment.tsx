import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
} from 'react'
import { BiTrash } from 'react-icons/bi'
import {
  Box,
  Button,
  ButtonProps,
  Center,
  Flex,
  forwardRef,
  Icon,
  Spacer,
  StyleProps,
  Text,
  useMultiStyleConfig,
  VStack,
} from '@chakra-ui/react'
import { omit, pick } from 'lodash'

import { formatBytes } from '~/utils/formatBytes'

import { BxsCloudUpload } from '~assets/icons'
import { DropzoneState, useAttachments } from '~hooks/useAttachments'
import { IconButton, IconButtonProps } from '~components/IconButton/IconButton'

interface AttachmentContextProps {
  getRootProps: DropzoneState['getRootProps']
  getInputProps: DropzoneState['getInputProps']
  /**
   * The files that have been accepted and uploaded.
   */
  acceptedFiles: DropzoneState['acceptedFiles']
  /**
   * The files that have been rejected
   */
  fileRejections: DropzoneState['fileRejections']
  /**
   * Resets the attachment state to its initial state (no accepted/rejected files)
   */
  reset: DropzoneState['reset']
  /**
   * The maximum allowable filesize, in bytes.
   */
  maxSize: number
}

const AttachmentContext = createContext<undefined | AttachmentContextProps>(
  undefined,
)

// Helper so that usages of hooks outside of context throws appropriately
const useContextValue = () => {
  const value = useContext(AttachmentContext)
  if (!value) {
    throw new Error(
      'Please ensure that useAttachmentContext is called within an AttachmentContext!',
    )
  }
  return value
}

// NOTE: Underlying styling and logic props are not exported to consumers of our context.
// This is because the context handles setting up of the dropzone and this should not be a concern.
// If consumers want access to these 2 hidden props, they should instead consume the hook.
export const useAttachmentContext = (): Omit<
  AttachmentContextProps,
  'getRootProps' | 'getInputProps'
> => {
  const value = useContextValue()
  return omit(value, ['getInputProps', 'getRootProps'])
}

const useDropzoneProps = () => {
  const value = useContextValue()
  return pick(value, ['getInputProps', 'getRootProps'])
}

export interface AttachmentProps {
  /**
   * The maximum allowed filesize to upload, in bytes
   */
  maxSizeInBytes: number
  /**
   * The callback to invoke when a file is dragged/selected.
   * Note that this runs even if the file is invalid.
   */
  onChange?: (f: File[]) => void
}

export const Attachment = ({
  maxSizeInBytes,
  children,
  onChange,
}: PropsWithChildren<AttachmentProps>): JSX.Element => {
  const onDrop = useCallback(
    (acceptedFiles) => {
      onChange?.(acceptedFiles)
    },
    [onChange],
  )

  const { acceptedFiles, fileRejections, reset, getRootProps, getInputProps } =
    useAttachments({ maxSize: maxSizeInBytes, onDrop })

  return (
    <AttachmentContext.Provider
      value={{
        getRootProps,
        getInputProps,
        acceptedFiles,
        reset,
        fileRejections,
        maxSize: maxSizeInBytes,
      }}
    >
      {children}
    </AttachmentContext.Provider>
  )
}

export type DropzoneProps = PropsWithChildren<ButtonProps>
export const Dropzone = forwardRef<DropzoneProps, 'input'>((props, ref) => {
  const styles = useMultiStyleConfig('Attachment', props)

  return (
    <DropzoneButton {...props} ref={ref}>
      <Box>
        <Icon as={BxsCloudUpload} sx={styles.icon} />
        <Text textStyle="body-1" fontWeight={500}>
          <Text as="u" sx={styles.text}>
            Choose file
          </Text>
          &nbsp;or drag and drop here
        </Text>
      </Box>
    </DropzoneButton>
  )
})

export const DropzoneButton = forwardRef<DropzoneProps, 'input'>(
  ({ ...props }, ref) => {
    const styles = useMultiStyleConfig('Attachment', props)
    const { getInputProps, getRootProps } = useDropzoneProps()

    return (
      <Button
        sx={styles.container}
        {...getRootProps(props as Record<string, unknown>)}
      >
        <Center>
          <VStack spacing="0.5rem">
            <input ref={ref} {...getInputProps()} />
            {props.children}
          </VStack>
        </Center>
      </Button>
    )
  },
)

// This component should not have behaviour as it is a simple stylistic wrapper to maintain theming.
type AttachedProps = PropsWithChildren<StyleProps>

export const Attached = ({
  children,
  ...props
}: AttachedProps): JSX.Element => {
  const styles = useMultiStyleConfig('Attachment', props)

  return (
    // NOTE: Due to how Chakra applies styling, sx has precedence over spread props.
    // This means that if we do not destructure into the sx props,
    // duplicate props given by users will be overriden by innate styling.
    <Box sx={{ ...styles.uploaded, ...props }}>{children}</Box>
  )
}

/**
 * This is a convenience wrapper to simply display file information.
 */
export const AttachmentInfo = (): JSX.Element => {
  const { acceptedFiles } = useAttachmentContext()
  return (
    <Attached>
      <Flex dir="row">
        <VStack spacing="0.5rem">
          {acceptedFiles.map((file) => (
            <VStack spacing="0.25rem" alignItems="flex-start">
              <Text textStyle="subhead-1">{file.name}</Text>
              <Text textStyle="caption-1">{formatBytes(file.size)}</Text>
            </VStack>
          ))}
        </VStack>
        <Spacer />
        <AttachmentActionIcon />
      </Flex>
    </Attached>
  )
}

interface AttachmentActionIconProps
  extends Omit<IconButtonProps, 'onClick' | 'aria-label'> {
  /**
   * The callback to invoke when the attachment component is closed.
   * This will be passed a list of all accepted files.
   */
  onClick?: (files: File[]) => void
  'aria-label'?: string
}

export const AttachmentActionIcon = ({
  icon = <BiTrash />,
  onClick,
  ...props
}: AttachmentActionIconProps): JSX.Element => {
  const styles = useMultiStyleConfig('Attachment', props)
  const { acceptedFiles, reset } = useAttachmentContext()

  return (
    <IconButton
      aria-label="Delete"
      onClick={() => {
        onClick?.(acceptedFiles)
        reset()
      }}
      icon={<BiTrash />}
      sx={styles.delete}
      variant="clear"
    />
  )
}
