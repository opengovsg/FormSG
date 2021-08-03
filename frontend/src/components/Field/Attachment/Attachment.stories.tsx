import { useController, useForm } from 'react-hook-form'
import { Button } from '@chakra-ui/react'
import { Meta, Story } from '@storybook/react'

import {
  Attachment,
  AttachmentField,
  AttachmentLabel,
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
type LabelledProps = {
  title: string
  number: number
}
export const LabelledDropzone: Story<AttachmentProps & LabelledProps> = ({
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

type PlaygroundProps = AttachmentProps & LabelledProps
export const Playground: Story<PlaygroundProps> = ({
  number,
  title,
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

const PlaygroundComponent = (props: LabelledProps) => {
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
