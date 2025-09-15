import { useController, useForm } from 'react-hook-form'
import {
  FormControl,
  FormErrorMessage,
  FormLabel,
  SimpleGrid,
  Stack,
  Text,
} from '@chakra-ui/react'
import { Meta, StoryFn } from '@storybook/react'

import { viewports } from '~/utils/storybook'

import Button from '~components/Button'

import { Rating, RatingProps } from './Rating'

export default {
  title: 'Components/Field/Rating',
  component: Rating,
  decorators: [],
} as Meta

const Template: StoryFn<RatingProps> = (args) => <Rating {...args} />

const ResponsiveGroup: StoryFn<RatingProps> = (args) => (
  <Stack spacing="2rem">
    <Rating
      {...args}
      name={`${args.name}-1`}
      value={3}
      numberOfRatings={10}
      variant="heart"
    />
    <Rating
      {...args}
      name={`${args.name}-2`}
      numberOfRatings={4}
      value={1}
      variant="star"
    />
    <Rating
      {...args}
      name={`${args.name}-3`}
      variant="number"
      value={3}
      numberOfRatings={8}
    />
  </Stack>
)

const TemplateGroup: StoryFn<RatingProps> = (args) => (
  <SimpleGrid
    columns={2}
    spacing={8}
    templateColumns="max-content auto"
    alignItems="center"
  >
    <Text>primary</Text>
    <Rating
      {...args}
      name={`${args.name}-p`}
      value={-1}
      colorScheme="primary"
    />
    <Text>theme-green</Text>
    <Rating
      {...args}
      name={`${args.name}-tg`}
      value={2}
      colorScheme="theme-green"
    />
    <Text>theme-teal</Text>
    <Rating
      {...args}
      name={`${args.name}-tt`}
      value={3}
      colorScheme="theme-teal"
    />
    <Text>theme-purple</Text>
    <Rating
      {...args}
      name={`${args.name}-tp`}
      value={4}
      colorScheme="theme-purple"
    />
    <Text>theme-grey</Text>
    <Rating
      {...args}
      name={`${args.name}-tgy`}
      value={5}
      colorScheme="theme-grey"
    />
    <Text>theme-yellow</Text>
    <Rating
      {...args}
      name={`${args.name}-ty`}
      value={4}
      colorScheme="theme-yellow"
    />
    <Text>theme-orange</Text>
    <Rating
      {...args}
      name={`${args.name}-to`}
      value={3}
      colorScheme="theme-orange"
    />
    <Text>theme-red</Text>
    <Rating
      {...args}
      name={`${args.name}-tr`}
      value={2}
      colorScheme="theme-red"
    />
    <Text>theme-brown</Text>
    <Rating
      {...args}
      name={`${args.name}-tb`}
      value={1}
      colorScheme="theme-brown"
    />
  </SimpleGrid>
)

export const Default = Template.bind({})
Default.args = {
  numberOfRatings: 10,
  variant: 'number',
  name: 'Test rating input',
}

export const Disabled = Template.bind({})
Disabled.args = {
  ...Default.args,
  isDisabled: true,
}

export const WithHelperText = Template.bind({})
WithHelperText.args = {
  numberOfRatings: 10,
  variant: 'number',
  name: 'Test rating input',
  helperText: '1: Strongly agree, 10: Strongly disagree',
}

export const VariantNumber = TemplateGroup.bind({})
VariantNumber.args = {
  name: 'Test rating input',
  numberOfRatings: 5,
  variant: 'number',
}
VariantNumber.storyName = 'Variant/Number'

export const VariantStar = TemplateGroup.bind({})
VariantStar.args = {
  name: 'Test rating input',
  numberOfRatings: 5,
  variant: 'star',
}
VariantStar.storyName = 'Variant/Star'

export const VariantHeart = TemplateGroup.bind({})
VariantHeart.args = {
  name: 'Test rating input',
  numberOfRatings: 5,
  variant: 'heart',
}
VariantHeart.storyName = 'Variant/Heart'

export const Mobile = ResponsiveGroup.bind({})
Mobile.args = {
  name: 'Test rating input',
  helperText: '1: Strongly agree, 10: Strongly disagree',
}
Mobile.parameters = {
  viewport: {
    defaultViewport: 'mobile1',
  },
  controls: {
    include: ['name', 'colorScheme', 'wrapComponentsPerRow', 'helperText'],
  },
  chromatic: { viewports: [viewports.xs] },
}

export const Tablet = ResponsiveGroup.bind({})
Tablet.args = {
  name: 'Test rating input',
  helperText: '1: Strongly agree, 10: Strongly disagree',
}
Tablet.parameters = {
  viewport: {
    defaultViewport: 'tablet',
  },
  controls: {
    include: ['name', 'colorScheme', 'wrapComponentsPerRow', 'helperText'],
  },
  chromatic: { viewports: [viewports.md] },
}

export const Playground: StoryFn = ({
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
    defaultValue: args.value,
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
          isRequired={isRequired}
          fieldTitle="Test rating field title"
          variant={variant}
          numberOfRatings={numberOfRatings}
          {...args}
          isDisabled={isDisabled}
          {...field}
        />
        <FormErrorMessage>{String(errors[name]?.message)}</FormErrorMessage>
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
  value: 3,
  numberOfRatings: 10,
  variant: 'number',
}
