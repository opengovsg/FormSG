import { useController, useForm } from 'react-hook-form'
import {
  FormControl,
  FormErrorMessage,
  FormLabel,
  SimpleGrid,
  Text,
} from '@chakra-ui/react'
import { Meta, Story } from '@storybook/react'

import { viewports } from '~utils/storybook'
import Button from '~components/Button'

import { YesNo, YesNoProps } from './YesNo'

export default {
  title: 'Components/Field/YesNo',
  component: YesNo,
  decorators: [],
} as Meta

const Template: Story<YesNoProps> = (args) => <YesNo {...args} />
export const Default = Template.bind({})
Default.args = {
  name: 'testInput',
}

const TemplateGroup: Story<YesNoProps> = (args) => (
  <SimpleGrid
    columns={2}
    spacing={8}
    templateColumns="max-content auto"
    alignItems="center"
  >
    <Text>primary</Text>
    <YesNo {...args} colorScheme="primary" />
    <Text>theme-green</Text>
    <YesNo {...args} colorScheme="theme-green" />
    <Text>theme-teal</Text>
    <YesNo {...args} colorScheme="theme-teal" />
    <Text>theme-purple</Text>
    <YesNo {...args} colorScheme="theme-purple" />
    <Text>theme-grey</Text>
    <YesNo {...args} colorScheme="theme-grey" />
    <Text>theme-yellow</Text>
    <YesNo {...args} colorScheme="theme-yellow" />
    <Text>theme-orange</Text>
    <YesNo {...args} colorScheme="theme-orange" />
    <Text>theme-red</Text>
    <YesNo {...args} colorScheme="theme-red" />
    <Text>theme-brown</Text>
    <YesNo {...args} colorScheme="theme-brown" />
  </SimpleGrid>
)
export const Selected = TemplateGroup.bind({})
Selected.args = {
  name: 'testInput',
  defaultValue: 'yes',
}
Selected.parameters = {
  controls: {
    include: ['name', 'isDisabled'],
  },
}

export const Disabled = TemplateGroup.bind({})
Disabled.args = {
  name: 'testInput',
  defaultValue: 'no',
  isDisabled: true,
}
Disabled.parameters = {
  controls: {
    include: ['name', 'isDisabled'],
  },
}

export const Mobile = Template.bind({})
Mobile.args = {
  name: 'testMobileInput',
}
Mobile.parameters = {
  viewport: {
    defaultViewport: 'mobile1',
  },
  chromatic: { viewports: [viewports.xs] },
}

export const Tablet = Template.bind({})
Tablet.args = {
  name: 'testTabletInput',
}
Tablet.parameters = {
  viewport: {
    defaultViewport: 'tablet',
  },
  chromatic: { viewports: [viewports.md] },
}

export const Playground: Story = ({
  name,
  label,
  isDisabled,
  isRequired,
  ...args
}) => {
  const { handleSubmit, control } = useForm()
  const onSubmit = (data: unknown) => alert(JSON.stringify(data))
  const {
    field,
    formState: { errors },
  } = useController({
    control,
    name,
    rules: {
      required: isRequired ? { value: true, message: 'Required field' } : false,
    },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <FormControl
        isRequired={isRequired}
        isDisabled={isDisabled}
        isInvalid={!!errors[name]}
        mb={6}
      >
        <FormLabel htmlFor={name}>{label}</FormLabel>
        <YesNo {...args} isDisabled={isDisabled} {...field} />
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
  isDisabled: false,
}
