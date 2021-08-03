import { useController, useForm } from 'react-hook-form'
import { Button } from '@chakra-ui/react'
import { Meta, Story } from '@storybook/react'

import {
  Attachment,
  AttachmentField,
  AttachmentInfo,
  AttachmentLabel,
  AttachmentLabelProps,
  AttachmentProps,
  Dropzone,
  useAttachmentContext,
} from './Attachment'

export default {
  title: 'Components/Field/Attachment',
  component: Attachment,
  decorators: [],
} as Meta

export const Default: Story<AttachmentProps> = (args) => (
  <Attachment {...args}>
    <Dropzone />
  </Attachment>
)
Default.bind({})

export const Disabled: Story<AttachmentProps> = (args) => (
  <Attachment {...args}>
    <Dropzone />
  </Attachment>
)
Disabled.bind({})
Disabled.args = {
  isDisabled: true,
}

export const Error: Story<AttachmentProps> = ({ ...args }) => (
  <Attachment {...args}>
    <Dropzone />
  </Attachment>
)
Error.bind({})
Error.args = {
  isInvalid: true,
}

export const Active: Story<AttachmentProps> = (args) => {
  const fakeFile = new File([], 'this is fake')
  return (
    <Attachment {...args}>
      <AttachmentInfo file={fakeFile} />
    </Attachment>
  )
}

Active.bind({})

type LabelledDropzoneProps = AttachmentProps & AttachmentLabelProps

export const LabelledDropzone: Story<LabelledDropzoneProps> = ({
  title,
  number,
  ...rest
}) => (
  <Attachment {...rest}>
    <AttachmentLabel title={title} number={number} />
    <Dropzone />
  </Attachment>
)
LabelledDropzone.bind({})
LabelledDropzone.args = {
  number: 1,
  title: 'Label',
}

export const Playground: Story<LabelledDropzoneProps> = ({
  number,
  title,
  ...props
}: LabelledDropzoneProps) => {
  const { handleSubmit, control } = useForm()
  const { field } = useController({
    name: 'Attachment Playground',
    control,
  })
  const onSubmit = (data: unknown) => alert(JSON.stringify(data))

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Attachment {...props} {...field}>
        <PlaygroundComponent title={title} number={number} />
      </Attachment>
    </form>
  )
}
Playground.bind({})
Playground.args = {
  number: 1,
  title: 'Label',
}

const PlaygroundComponent = (props: AttachmentLabelProps) => {
  const { fileRejections } = useAttachmentContext()
  const isError = !!fileRejections.length

  return (
    <>
      <AttachmentLabel {...props} />
      <AttachmentField />
      <Button mt="8px" type="submit" isDisabled={isError}>
        Submit
      </Button>
    </>
  )
}
