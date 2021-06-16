import {
  Input as ChakraInput,
  InputProps as ChakraInputProps,
} from '@chakra-ui/react'

export type InputProps = ChakraInputProps

/**
 * Work in progress, may end up not needing this component at all as all this
 * component is doing is wrapping Chakra's Input.
 */
export const Input = (props: InputProps): JSX.Element => {
  return <ChakraInput {...props} />
}
