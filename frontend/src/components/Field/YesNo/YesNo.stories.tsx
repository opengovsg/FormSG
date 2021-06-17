import { useController, useForm } from 'react-hook-form'
import {
  FormControl,
  FormErrorMessage,
  FormLabel,
} from '@chakra-ui/form-control'
import { Meta, Story } from '@storybook/react'

import Button from '~components/Button'

import { YesNo, YesNoProps } from './YesNo'

export default {
  title: 'Components/YesNo',
  component: YesNo,
  decorators: [],
} as Meta

const Template: Story<YesNoProps> = (args) => <YesNo {...args} />
export const Default = Template.bind({})
Default.args = {
  name: 'testInput',
}

export const Selected = Template.bind({})
Selected.args = {
  name: 'testInput',
  currentValue: 'yes',
}

export const Mobile = Template.bind({})
Mobile.args = {
  name: 'testMobileInput',
}
Mobile.parameters = {
  viewport: {
    defaultViewport: 'mobile1',
  },
}

export const Tablet = Template.bind({})
Tablet.args = {
  name: 'testTabletInput',
}
Tablet.parameters = {
  viewport: {
    defaultViewport: 'tablet',
  },
}

export const Playground: Story = ({ name, label, isRequired }) => {
  const { handleSubmit, control } = useForm()
  const onSubmit = (data: any) => alert(JSON.stringify(data))
  const {
    field,
    formState: { errors },
  } = useController({
    control,
    name,
    rules: { required: { value: true, message: 'Required field' } },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <FormControl isRequired={isRequired} isInvalid={!!errors[name]} mb={6}>
        <FormLabel>{label}</FormLabel>
        <YesNo
          name={name}
          onChange={field.onChange}
          currentValue={field.value}
        />
        <FormErrorMessage>
          {errors[name] && errors[name].message}
        </FormErrorMessage>
      </FormControl>
      <Button type="submit">Submit</Button>
    </form>
  )
}
Playground.args = {
  name: 'Test playground input',
  label: 'YesNo field label',
  isRequired: false,
}
