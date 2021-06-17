import { cloneElement } from 'react'
import {
  Flex,
  Input,
  Radio as ChakraRadio,
  RadioGroup,
  RadioGroupProps as ChakraRadioProps,
  StylesProvider,
  useMultiStyleConfig,
  useStyles,
  VStack,
} from '@chakra-ui/react'

export interface RadioProps extends Omit<ChakraRadioProps, 'children'> {
  children?: React.ReactNode // Children should be optional as radio components should be created in here
  options?: string[]
  other: boolean
  otherComponent?: JSX.Element // TODO: change type to disjunction of acceptable components
}

const defaultOtherComponent = <Input placeholder="Please specify"></Input> // TODO: replace with custom input component

const RadioOption = ({ option }: { option: string }): JSX.Element => {
  const styles = useStyles()
  return (
    <ChakraRadio value={option} __css={styles.row}>
      {option}
    </ChakraRadio>
  )
}

const OtherOption = ({
  component,
}: {
  component: JSX.Element
}): JSX.Element => {
  const styles = useStyles()
  return (
    <Flex direction="column">
      <RadioOption option="Other" />
      <Flex pl="48px" mt="2px">
        {cloneElement(component, {
          isRequired: true,
          __css: styles.others,
        })}
      </Flex>
    </Flex>
  )
}

export const Radio = ({
  children,
  options,
  other = false,
  otherComponent = defaultOtherComponent,
  ...props
}: RadioProps): JSX.Element => {
  const styles = useMultiStyleConfig('Radio', {})

  return (
    <RadioGroup {...props}>
      <StylesProvider value={styles}>
        <VStack align="left">
          {options?.map((option) => (
            <RadioOption option={option} />
          ))}
          {other && <OtherOption component={otherComponent}></OtherOption>}
        </VStack>
      </StylesProvider>
    </RadioGroup>
  )
}
