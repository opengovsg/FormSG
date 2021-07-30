import { FileError } from 'react-dropzone'
import { useController, useForm } from 'react-hook-form'
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  HStack,
  Text,
} from '@chakra-ui/react'
import { Meta, Story } from '@storybook/react'

import FormErrorMessage from '~/components/FormControl/FormErrorMessage'
import FormFieldMessage from '~/components/FormControl/FormFieldMessage'
import { formatBytes } from '~/utils/formatBytes'

import {
  Attachment,
  AttachmentInfo,
  AttachmentProps,
  Dropzone,
  DropzoneProps,
  useAttachmentContext,
} from './Attachment'

export default {
  title: 'Components/Field/Attachment',
  component: Attachment,
  decorators: [],
} as Meta

export const Default: Story<AttachmentProps> = (args) => (
  <Attachment {...args}>
    <AttachmentComponent />
  </Attachment>
)
Default.bind({
  maxSizeInBytes: 2 * 10 ** 6,
})

export const Disabled: Story<AttachmentProps> = (args) => (
  <Attachment {...args}>
    <Dropzone isDisabled />
  </Attachment>
)
Disabled.bind({})

type LabelledProps = {
  labelText: string
  labelNumber: number
}
export const Labelled: Story<AttachmentProps & LabelledProps> = ({
  labelText,
  labelNumber,
  ...args
}) => (
  <FormControl>
    <Attachment {...args}>
      <FormLabel>
        <HStack spacing="0.5rem">
          <Text textStyle="caption-1">{`${labelNumber}.`}</Text>
          <Text textStyle="subhead-1">{labelText}</Text>
        </HStack>
      </FormLabel>
      <AttachmentComponent />
    </Attachment>
  </FormControl>
)
Labelled.bind({})
Labelled.args = {
  labelNumber: 1,
  labelText: 'Label',
}

type ErrorProps = { errorMessage: string }
export const Error: Story<AttachmentProps & ErrorProps> = ({
  errorMessage,
  ...args
}) => (
  <FormControl>
    <Attachment {...args}>
      <AttachmentComponent />
    </Attachment>
    <FormErrorMessage>{errorMessage}</FormErrorMessage>
  </FormControl>
)
Error.bind({})
Error.args = {
  errorMessage: 'Some error message here',
}

const AttachmentComponent = (args: DropzoneProps) => {
  const { acceptedFiles } = useAttachmentContext()
  const hasUploadedFiles = !!acceptedFiles.length
  return hasUploadedFiles ? (
    <AttachmentInfo />
  ) : (
    <Box maxWidth="min-content" whiteSpace="pre-line">
      <Dropzone {...args} />
    </Box>
  )
}

type PlaygroundProps = DropzoneProps & AttachmentProps & LabelledProps
export const Playground: Story<PlaygroundProps> = ({
  maxSizeInBytes,
  ...props
}: PlaygroundProps) => {
  const { handleSubmit, control } = useForm()
  const { field } = useController({
    name: 'Attachment Playground',
    control,
  })
  const onSubmit = (data: unknown) => alert(JSON.stringify(data))

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Attachment maxSizeInBytes={maxSizeInBytes} {...field}>
        <PlaygroundComponent {...props} />
      </Attachment>
    </form>
  )
}
Playground.bind({})
Playground.args = {
  labelNumber: 1,
  labelText: 'Label',
}

const PlaygroundComponent = (props: DropzoneProps) => {
  const { acceptedFiles, fileRejections, maxSize } = useAttachmentContext()
  const hasUploadedFiles = !!acceptedFiles.length
  const isError = !!fileRejections.length
  const formattedMaxSize = formatBytes(maxSize, 0)

  const getErrorMessage = (error: FileError) =>
    error.code === 'file-too-large'
      ? `You have exceeded the limit, please upload a file below ${formattedMaxSize}`
      : 'Please ensure that only 1 file is uploaded!'

  return (
    <FormControl isInvalid={isError}>
      <FormLabel>
        <HStack spacing="0.5rem">
          <Text textStyle="caption-1">1. </Text>
          <Text textStyle="subhead-1">Label</Text>
        </HStack>
      </FormLabel>
      {hasUploadedFiles ? (
        <AttachmentInfo />
      ) : (
        <Box maxWidth="min-content" whiteSpace="pre-line">
          <Dropzone {...props} isError={isError} />
          {isError ? (
            <FormErrorMessage>
              {getErrorMessage(fileRejections[0].errors[0])}
            </FormErrorMessage>
          ) : (
            <FormFieldMessage>{`Maximum file size: ${formattedMaxSize}`}</FormFieldMessage>
          )}
        </Box>
      )}
      <Button mt="8px" type="submit" isDisabled={isError}>
        Submit
      </Button>
    </FormControl>
  )
}
