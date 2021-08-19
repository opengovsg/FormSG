import { Controller, useForm } from 'react-hook-form'
import { FormControl } from '@chakra-ui/react'
import { Meta, Story } from '@storybook/react'

import Button from '~components/Button'
import FormErrorMessage from '~components/FormControl/FormErrorMessage'

import { Attachment, AttachmentProps } from './Attachment'

export default {
  title: 'Components/Attachment',
  component: Attachment,
  decorators: [],
} as Meta

const Template: Story<AttachmentProps> = (args) => {
  const {
    control,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm()

  const isInvalid = !!errors?.[args.name]

  const onSubmit = (values: any) => {
    console.log(values)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <FormControl isInvalid={isInvalid}>
        <Controller
          render={({ field: { onChange, ...rest } }) => (
            <Attachment
              {...args}
              {...rest}
              showFileSize={!isInvalid}
              onChange={(file) => {
                clearErrors(args.name)
                onChange(file)
              }}
              onError={(message: string) => setError(args.name, { message })}
            />
          )}
          name={args.name}
          rules={{
            required: 'Required!!!',
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
export const Default = Template.bind({})
Default.args = {
  name: 'Test-attachment',
  maxSize: 400000,
}
