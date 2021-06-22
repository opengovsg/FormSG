import { useController, useForm } from 'react-hook-form'
import { FormControl, FormErrorMessage, FormLabel } from '@chakra-ui/react'
import { Meta, Story } from '@storybook/react'

import Button from '~components/Button'

import { Rating, RatingProps } from './Rating'

export default {
  title: 'Components/Field/Rating',
  component: Rating,
  decorators: [],
} as Meta

const Template: Story<RatingProps> = (args) => <Rating {...args} />
export const Default = Template.bind({})
Default.args = {
  numberOfRatings: 10,
  variant: 'Number',
  name: 'some',
}

export const Selected = Template.bind({})
Selected.args = {
  defaultValue: 4,
  numberOfRatings: 10,
  variant: 'Number',
  name: 'some',
}

export const Playground: Story = ({
  name,
  label,
  isDisabled,
  isRequired,
  variant,
  numberOfRatings,
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
        <Rating
          variant={variant}
          numberOfRatings={numberOfRatings}
          {...args}
          isDisabled={isDisabled}
          {...field}
        />
        <FormErrorMessage>
          {errors[name] && errors[name].message}
        </FormErrorMessage>
      </FormControl>
      <Button type="submit" colorScheme={args.colorScheme}>
        Submit
      </Button>
    </form>
  )
}
Playground.args = {
  name: 'Test playground input',
  label: 'Rating field label',
  isRequired: false,
  isDisabled: false,
  defaultValue: 3,
  numberOfRatings: 10,
  variant: 'Number',
}
