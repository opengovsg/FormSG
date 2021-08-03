import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
} from 'react'
import { FileError } from 'react-dropzone'
import { BiTrash } from 'react-icons/bi'
import {
  Box,
  Button,
  ButtonProps,
  Center,
  Flex,
  FormControl,
  FormLabel,
  forwardRef,
  HStack,
  Icon,
  Spacer,
  StyleProps,
  Text,
  useFormControlContext,
  useMultiStyleConfig,
  VStack,
} from '@chakra-ui/react'
import { omit, pick } from 'lodash'

import FormErrorMessage from '~/components/FormControl/FormErrorMessage'
import FormFieldMessage from '~/components/FormControl/FormFieldMessage'
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
  /**
   * Boolean indicating if a file is being dragged over the dropzone
   */
  isDragActive: DropzoneState['isDragActive']
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

  const {
    acceptedFiles,
    fileRejections,
    reset,
    getRootProps,
    getInputProps,
    isDragActive,
  } = useAttachments({ maxSize: maxSizeInBytes, onDrop, multiple: false })

  return (
    <AttachmentContext.Provider
      value={{
        getRootProps,
        getInputProps,
        acceptedFiles,
        reset,
        fileRejections,
        maxSize: maxSizeInBytes,
        isDragActive,
      }}
    >
      <FormControl isInvalid={!!fileRejections.length}>{children}</FormControl>
    </AttachmentContext.Provider>
  )
}

export const AttachmentField = (): JSX.Element => {
  const { acceptedFiles } = useAttachmentContext()
  return acceptedFiles.length ? <AttachmentInfo /> : <Dropzone />
}

export type DropzoneProps = PropsWithChildren<ButtonProps>
export const Dropzone = forwardRef<DropzoneProps, 'input'>((props, ref) => {
  const styles = useMultiStyleConfig('Attachment', props)

  return (
    <Box maxWidth="min-content" whiteSpace="pre-line">
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
      <AttachmentHelperMessage />
    </Box>
  )
})

const DropzoneButton = forwardRef<DropzoneProps, 'input'>(
  ({ ...props }, ref) => {
    const { isDragActive } = useAttachmentContext()
    const styles = useMultiStyleConfig('Attachment', { ...props, isDragActive })
    const { getInputProps, getRootProps } = useDropzoneProps()

    return (
      <Button
        {...getRootProps({
          sx: styles.container,
          ...(props as Record<string, unknown>),
        })}
        sx={styles.container}
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
type AttachmentInfoProps = PropsWithChildren<StyleProps> & {
  file: File
}

/**
 * This is a convenience wrapper to simply display file information.
 */
export const AttachmentInfo = ({
  file,
  children,
  ...rest
}: AttachmentInfoProps): JSX.Element => {
  const { name, size } = file
  const styles = useMultiStyleConfig('Attachment', rest)

  return (
    // _css has lower precedence than sx and hence, we allow users to override the base styling
    <Box _css={styles.uploaded} sx={rest}>
      <Flex dir="row">
        <VStack spacing="0.25rem" alignItems="flex-start">
          {/* NOTE: role and tabIndex is set for accessibility reasons.
           * Setting the role allows screen readers to read out the text once successfully uploaded.
           * Setting tabIndex allows screen readers/keyboard users to focus on the element and get information.
           */}
          <Text textStyle="subhead-1" tabIndex={0} role="alert">
            {name}
          </Text>
          <Text textStyle="caption-1" tabIndex={0}>
            {formatBytes(size)}
          </Text>
        </VStack>
        <Spacer />
        <AttachmentActionIcon />
      </Flex>
      {children}
    </Box>
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

const AttachmentActionIcon = ({
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

const getErrorMessage = (error: FileError, maxSize: number) =>
  error.code === 'file-too-large'
    ? `You have exceeded the limit, please upload a file below ${formatBytes(
        maxSize,
        0,
      )}`
    : 'Please ensure that only 1 file is uploaded!'

const AttachmentHelperMessage = (): JSX.Element => {
  const { maxSize, fileRejections } = useAttachmentContext()
  const { isInvalid } = useFormControlContext()
  return isInvalid ? (
    <FormErrorMessage role="alert">
      {getErrorMessage(fileRejections[0].errors[0], maxSize)}
    </FormErrorMessage>
  ) : (
    <FormFieldMessage>{`Maximum file size: ${formatBytes(
      maxSize,
    )}`}</FormFieldMessage>
  )
}

export interface AttachmentLabelProps {
  number?: number
  title?: string
}

export const AttachmentLabel = ({
  number,
  title,
}: AttachmentLabelProps): JSX.Element => {
  return (
    <FormLabel>
      <HStack spacing="0.5rem">
        {/* NOTE: this is done because 0 is a falsy value... */}
        {(!!number || number === 0) && (
          <Text textStyle="caption-1">{`${number}.`}</Text>
        )}
        {title && <Text textStyle="subhead-1">{title}</Text>}
      </HStack>
    </FormLabel>
  )
}
