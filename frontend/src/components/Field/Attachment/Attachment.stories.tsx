import { Controller, useForm } from 'react-hook-form'
import { FormControl } from '@chakra-ui/react'
import { Meta, StoryFn } from '@storybook/react'

import Button from '~components/Button'
import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import FormLabel from '~components/FormControl/FormLabel'

import { Attachment, AttachmentProps } from './Attachment'

export default {
  title: 'Components/Field/Attachment',
  component: Attachment,
  decorators: [],
} as Meta

const Template: StoryFn<AttachmentProps> = (args) => {
  return <Attachment {...args} />
}

export const Default = Template.bind({})
Default.args = {
  name: 'Test-input',
  maxSize: 23000,
}

export const ShowMaxSize = Template.bind({})
ShowMaxSize.args = {
  name: 'Test-input',
  maxSize: 23000,
  showFileSize: true,
}

export const Invalid = Template.bind({})
Invalid.args = {
  name: 'Test-input',
  isInvalid: true,
}

export const Disabled = Template.bind({})
Disabled.args = {
  name: 'Test-input',
  isDisabled: true,
}

export const WithUploadedFile = Template.bind({})
WithUploadedFile.args = {
  name: 'Test-input',
  value: Object.defineProperty(
    new File([''], 'mock file', { type: 'text/html' }),
    'size',
    { value: 1100 * 1000 },
  ),
  onChange: () => console.log('delete button pressed'),
}

export const Playground: StoryFn<AttachmentProps> = ({
  isDisabled,
  isReadOnly,
  ...args
}) => {
  const {
    control,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm()

  const isInvalid = !!errors?.[args.name]

  const onSubmit = (values: Record<string, File>) => {
    const stringifyFile = (obj: File) => {
      const replacer = []
      for (const key in obj) {
        replacer.push(key)
      }
      return JSON.stringify(obj, replacer)
    }
    alert(stringifyFile(values[args.name]))
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <FormControl
        isInvalid={isInvalid}
        isDisabled={isDisabled}
        isReadOnly={isReadOnly}
      >
        <FormLabel>Attachments are cool</FormLabel>
        <Controller
          render={({ field: { onChange, ...rest } }) => (
            <Attachment
              {...args}
              {...rest}
              showFileSize={!isInvalid && args.showFileSize}
              onChange={(file) => {
                clearErrors(args.name)
                onChange(file)
              }}
              onError={(message: string) => setError(args.name, { message })}
            />
          )}
          name={args.name}
          rules={{
            required: 'This field is required',
          }}
          control={control}
        />
        <FormErrorMessage>
          {errors[args.name] && errors[args.name].message}
        </FormErrorMessage>
      </FormControl>
      <Button type="submit">Submit</Button>
    </form>
  )
}
Playground.args = {
  name: 'Test-attachment',
  maxSize: 400000,
  isReadOnly: false,
  isDisabled: false,
}
