import { cloneElement, isValidElement, useCallback } from 'react'
import {
  Checkbox as ChakraCheckbox,
  CheckboxGroup,
  CheckboxGroupProps as ChakraCheckboxGroupProps,
  CheckboxProps as ChakraCheckboxProps,
  Flex,
  forwardRef,
  Input,
  useCheckbox,
  useCheckboxGroup,
  UseCheckboxGroupProps,
  UseCheckboxGroupReturn,
  UseCheckboxProps,
  VStack,
} from '@chakra-ui/react'

export interface CheckboxProps extends ChakraCheckboxGroupProps {
  /**
   * Checkbox options
   */
  options?: string[]
  /**
   * Whether other option is activated. Added to allow for a default other component and will be false by default.
   */
  other: boolean
  /**
   * Function called once a checkbox is checked
   * @param nextValue the value of the checked checkbox
   */
  onChange?: UseCheckboxGroupProps['onChange']
  /**
   * The value of the checkbox to be `checked`
   * (in controlled mode)
   *
   */
  value?: string[]
  /**
   * The value of the checkbox to be `checked` initially
   * (in uncontrolled mode)
   */
  defaultValue?: string[]
  /**
   * The `name` attribute forwarded to each `checkbox` element
   */
  name: string
}

interface OthersProps extends UseCheckboxProps {
  children?: React.ReactNode
}

const defaultOtherComponent = (
  <Input required={true} placeholder="Please specify"></Input>
) // TODO: replace with custom input component

const CheckboxOption = ({
  option,
}: { option: string } & ChakraCheckboxProps): JSX.Element => {
  return <ChakraCheckbox value={option}>{option}</ChakraCheckbox>
}

const OtherOption = forwardRef<OthersProps, 'input'>(
  ({ children, ...props }, ref) => {
    const { getInputProps } = useCheckbox(props)
    const input = getInputProps({}, ref)

    const handleChange = useCallback(() => {
      if (!props.isChecked && input.onChange) {
        // eslint-disable-next-line @typescript-eslint/no-extra-semi
        ;(input.onChange as UseCheckboxGroupReturn['onChange'])('Other')
      }
    }, [props.isChecked, input.onChange])

    return (
      <Flex direction="column">
        <CheckboxOption option="Other" />
        <Flex pl="48px" mt="2px">
          {isValidElement(children) &&
            cloneElement(children, {
              onClick: handleChange,
            })}
        </Flex>
      </Flex>
    )
  },
)

export const Checkbox = forwardRef<CheckboxProps, 'input'>(
  (
    { children = defaultOtherComponent, options, other = false, ...props },
    ref,
  ) => {
    const { getCheckboxProps } = useCheckboxGroup(props)
    const checkbox = getCheckboxProps({
      value: 'Other',
      id: props.name,
    })

    return (
      <CheckboxGroup {...props}>
        <VStack align="left">
          {options?.map((option) => (
            <CheckboxOption option={option} />
          ))}
          {other && (
            <OtherOption {...checkbox} ref={ref}>
              {children}
            </OtherOption>
          )}
        </VStack>
      </CheckboxGroup>
    )
  },
)
