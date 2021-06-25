import { useCallback, useContext, useState } from 'react'
import { useController, useFieldArray, useForm } from 'react-hook-form'
import {
  CheckboxGroup,
  // Checkbox,
  CheckboxProps,
  FormControl,
  FormErrorMessage,
  FormLabel,
  forwardRef,
  Input,
  useCheckbox,
  useCheckboxGroup,
  UseCheckboxGroupReturn,
  VStack,
} from '@chakra-ui/react'
import { Meta, Story } from '@storybook/react'

// import CheckboxOthers from '~/components/Checkbox/CheckboxOthers'
import Button from '~components/Button'

import { Checkbox, CheckboxOthers, Others } from './Checkbox'

export default {
  title: 'Components/Checkbox',
  component: Checkbox,
  decorators: [],
} as Meta

export const TemplateGroup: Story<CheckboxProps> = (args) => {
  return (
    <VStack align="left">
      <Checkbox value="Option 1">Option 1</Checkbox>
      <Checkbox value="Option 1">Option 2</Checkbox>
      <Checkbox value="Option 1">Option 3</Checkbox>
    </VStack>
  )
}

export const TemplateGroupOthers: Story<CheckboxProps> = (args) => {
  return (
    <VStack align="left">
      <Checkbox value="Option 1">Option 1</Checkbox>
      <Checkbox value="Option 1">Option 2</Checkbox>
      <Checkbox value="Option 1">Option 3</Checkbox>
      {/* <CheckboxOthers placeholder="Please Specify" /> */}
    </VStack>
  )
}

export const TemplateGroupOthers2: Story = (args) => {
  return (
    <VStack align="left">
      <CheckboxOthers {...args} />
      {/* <CheckboxOthers placeholder="Please Specify" /> */}
    </VStack>
  )
}

export const Test = TemplateGroupOthers2.bind({})
Test.args = {}

// export const OthersInput = Template.bind({})
// OthersInput.args = {
//   options: ['Option 1', 'Option 2', 'Option 3'],
//   other: true,
// }

export const Playground: Story = ({
  name,
  label,
  isDisabled,
  isRequired,
  ...args
}) => {
  const { register, handleSubmit, control } = useForm()
  const onSubmit = (data: Record<string, string>) => {
    alert(JSON.stringify(data))
  }
  // const { fields } = useFieldArray({
  //   control,
  //   name,
  // })
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

  const [isChecked, setIsChecked] = useState(false)

  const handleClick = () => {
    if (!isChecked) {
      setIsChecked(true)
    }
  }

  const selectOther = () => {
    setIsChecked(!isChecked)
  }

  // const test = useCheckbox()

  // const modularInput = () => {
  //   const { setOnFocus } = useCheckboxState()
  //   setOnFocus(handleClick)
  //   return (
  //     <Checkbox>
  //       <Checkbox.Others>
  //         <Input placeholder="Please specify" />
  //       </Checkbox.Others>
  //     </Checkbox>
  //   )
  // }

  // takes same props as checkbox but with additional placeholder prop for input
  // behaviour changes because this is not controllable
  const CheckboxInput = forwardRef<CheckboxProps, 'input'>(
    ({ value, placeholder, ...props }, ref) => {
      // const [isChecked, setIsChecked] = useState(false)

      // const handleClick = () => {
      //   if (!isChecked) {
      //     setIsChecked(true)
      //   }
      // }

      // const selectOther = () => {
      //   setIsChecked(!isChecked)
      // }
      return (
        <Checkbox
          //   isChecked={isChecked}
          //   onChange={selectOther}
          value={value}
          {...props}
        >
          <Others>
            <Input
              placeholder={placeholder}
              ref={ref}
              // onClick={handleClick}
            ></Input>
          </Others>
        </Checkbox>
      )
    },
  )

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <FormControl
        isRequired={isRequired}
        isDisabled={isDisabled}
        isInvalid={!!errors[name]}
        mb={6}
      >
        <FormLabel htmlFor={name}>{label}</FormLabel>
        <VStack align="left">
          <Checkbox value="Option 1" {...register('Option 1')} />
          <Checkbox value="Option 2" {...register('Option 2')} />
          <Checkbox value="Option 3" {...register('Option 3')} />
          <CheckboxInput
            value="something"
            placeholder="specify me"
            {...register('othersValue')}
          />
          {/* expose context on checkbox */}
          <Checkbox value="Others" {...register('composed')}>
            <Others>
              <Input
                placeholder="Please specify"
                {...register('nested input')}
              ></Input>
            </Others>
          </Checkbox>
        </VStack>
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
  label: 'Checkbox Field',
  isRequired: false,
  isDisabled: false,
}
