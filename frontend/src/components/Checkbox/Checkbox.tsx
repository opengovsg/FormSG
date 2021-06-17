import { cloneElement } from 'react'
import {
  Checkbox as ChakraCheckbox,
  CheckboxGroup,
  CheckboxGroupProps as ChakraCheckboxProps,
  Flex,
  StylesProvider,
  useMultiStyleConfig,
  useStyles,
  VStack,
} from '@chakra-ui/react'

export interface CheckboxProps extends ChakraCheckboxProps {
  options?: string[]
  otherComponent?: JSX.Element // TODO: change type to disjunction of acceptable components
}

const CheckboxOption = ({ option }: { option: string }): JSX.Element => {
  const styles = useStyles()
  return (
    <ChakraCheckbox value={option} __css={styles.container}>
      {option}
    </ChakraCheckbox>
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
      <CheckboxOption option="Other" />
      <Flex pl="48px" mt="2px">
        {cloneElement(component, {
          isRequired: true,
          __css: styles.others,
        })}
      </Flex>
    </Flex>
  )
}

export const Checkbox = ({
  options,
  otherComponent,
  ...props
}: CheckboxProps): JSX.Element => {
  const styles = useMultiStyleConfig('Checkbox', {})

  return (
    <CheckboxGroup {...props}>
      <StylesProvider value={styles}>
        <VStack align="left">
          {options?.map((option) => (
            <CheckboxOption option={option} />
          ))}
          {otherComponent && (
            <OtherOption component={otherComponent}></OtherOption>
          )}
        </VStack>
      </StylesProvider>
    </CheckboxGroup>
  )
}
