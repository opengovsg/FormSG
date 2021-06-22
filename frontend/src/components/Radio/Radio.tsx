import { cloneElement, isValidElement, useCallback, useMemo } from 'react'
import {
  Flex,
  forwardRef,
  Input,
  Radio as ChakraRadio,
  RadioGroup,
  RadioGroupProps as ChakraRadioGroupProps,
  useRadio,
  useRadioGroup,
  UseRadioGroupReturn,
  UseRadioProps,
  VStack,
} from '@chakra-ui/react'

export interface RadioProps extends Omit<ChakraRadioGroupProps, 'children'> {
  /**
   * Child components will be used as the other's component if other is toggled to true.
   * This is specified here as ChakraRadioGroupProps requires children to be non-optional.
   */
  children?: React.ReactNode
  /**
   * Radio options.
   */
  options?: string[]
  /**
   * Whether other option is activated. Added to allow for a default other component and will be false by default.
   */
  other: boolean
}

interface RadioOther extends UseRadioProps {
  children?: React.ReactNode
}

const defaultOtherComponent = <Input placeholder="Please specify"></Input> // TODO: replace with custom input component

const RadioOption = ({ option }: { option: string }): JSX.Element => {
  return <ChakraRadio value={option}>{option}</ChakraRadio>
}

const OtherOption = forwardRef<RadioOther, 'input'>(
  ({ children, ...props }, ref) => {
    const { getInputProps } = useRadio(props)
    const input = getInputProps({}, ref)

    const handleChange = useCallback(() => {
      if (!props.isChecked && input.onChange) {
        // eslint-disable-next-line @typescript-eslint/no-extra-semi
        ;(input.onChange as UseRadioGroupReturn['onChange'])('Other')
      }
    }, [props.isChecked, input.onChange])

    return (
      <Flex direction="column">
        <RadioOption option="Other" />
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

export const Radio = forwardRef<RadioProps, 'input'>(
  (
    { children = defaultOtherComponent, options, other = false, ...props },
    ref,
  ) => {
    const { getRadioProps } = useRadioGroup(props)
    const radio = useMemo(() => {
      const baseProps = {
        enterKeyHint: '',
        id: props.name,
      }
      return getRadioProps({
        value: 'Other',
        ...baseProps,
      })
    }, [getRadioProps, props.name])

    return (
      <RadioGroup {...props}>
        <VStack align="left">
          {options?.map((option) => (
            <RadioOption option={option} />
          ))}
          {other && (
            <OtherOption {...radio} ref={ref}>
              {children}
            </OtherOption>
          )}
        </VStack>
      </RadioGroup>
    )
  },
)
