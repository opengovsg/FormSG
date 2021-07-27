/* eslint-disable @typescript-eslint/no-unused-vars */
import { createContext, PropsWithChildren, useContext } from 'react'
import { BiTrash } from 'react-icons/bi'
import {
  Box,
  BoxProps,
  Button,
  ButtonProps,
  Center,
  Flex,
  Icon,
  IconButton,
  IconButtonProps,
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

interface AttachmentContextProps {
  getRootProps: DropzoneState['getRootProps']
  getInputProps: DropzoneState['getInputProps']
  acceptedFiles: DropzoneState['acceptedFiles']
  fileRejections: DropzoneState['fileRejections']
  reset: DropzoneState['reset']
  maxSize?: number
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

export const Attachment = (maxSize?: number): JSX.Element => {
  const { acceptedFiles, fileRejections, reset, getRootProps, getInputProps } =
    useAttachments({ maxSize })

  const hasUploadedFiles = !!acceptedFiles.length

  return (
    <AttachmentContext.Provider
      value={{
        getRootProps,
        getInputProps,
        acceptedFiles,
        reset,
        fileRejections,
        maxSize,
      }}
    >
      {/* TODO: change this to children tmrw */}
      {hasUploadedFiles ? <Attached /> : <Dropzone />}
    </AttachmentContext.Provider>
  )
}

type DropzoneProps = ButtonProps

// Check with designers if this is actually form label/form field message etc
// A: This is actually the form xx component
export const Dropzone = (props: DropzoneProps): JSX.Element => {
  const styles = useMultiStyleConfig('Attachment', props)

  return (
    <DropzoneButton {...props}>
      <Icon as={BxsCloudUpload} sx={styles.icon} />
      {/* double check if the 500 is actually intended */}
      <Text textStyle="body-1" fontWeight={500}>
        <Text as="u" sx={styles.text}>
          Choose file
        </Text>
        &nbsp;or drag and drop here
      </Text>
    </DropzoneButton>
  )
}

export const DropzoneButton = (props: DropzoneProps): JSX.Element => {
  const styles = useMultiStyleConfig('Attachment', props)
  const { getInputProps, getRootProps } = useDropzoneProps()

  return (
    <Button
      sx={styles.container}
      data-js-focus-visible
      data-focus-visible-added
      {...getRootProps(props as Record<string, unknown>)}
    >
      <Center>
        <VStack spacing="0.5rem">
          <input {...getInputProps()} />
          {props.children}
        </VStack>
      </Center>
    </Button>
  )
}

type AttachedProps = PropsWithChildren<StyleProps>

// This component should not have behaviour as it is a simple stylistic wrapper to maintain theming.
export const _Attached = ({
  children,
  ...props
}: AttachedProps): JSX.Element => {
  const styles = useMultiStyleConfig('Attachment', props)
  // consider passing the files as a prop down into children?

  return (
    // NOTE: Due to how Chakra applies styling, sx has precedence over spread props.
    // This means that if we do not destructure into the sx props,
    // duplicate props given by users will be overriden by innate styling.
    <Box sx={{ ...styles.uploaded, ...props }}>{children}</Box>
  )
}

export const Attached = () => {
  const { acceptedFiles } = useAttachmentContext()
  return (
    <_Attached>
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
    </_Attached>
  )
}

interface AttachmentActionIconProps
  extends Omit<IconButtonProps, 'onClick' | 'aria-label'> {
  onClick?: (files: File[]) => void
  'aria-label'?: string
}

// Q: Should the icon resize when screen gets bigger
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
      icon={icon}
      sx={styles.delete}
      variant="ghost"
    />
  )
}
