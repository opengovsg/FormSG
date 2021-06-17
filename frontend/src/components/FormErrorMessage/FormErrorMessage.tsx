import {
  FormErrorIcon,
  FormErrorMessage as ChakraFormErrorMessage,
  FormErrorMessageProps as ChakraFormErrorMessageProps,
  IconProps,
  useMultiStyleConfig,
} from '@chakra-ui/react'

import { ErrorCircleSolid } from '~assets/icons'

export type FormErrorMessageProps = ChakraFormErrorMessageProps

/**
 * @precondition Requires ChakraUI's `FormControl` element with isInvalid prop before text will show.
 *
 * Used to provide feedback about an invalid input, and suggest clear instructions on how to fix it.
 */
export const FormErrorMessage = ({
  children,
  ...props
}: FormErrorMessageProps): JSX.Element => {
  const {
    text: { lineHeight },
  } = useMultiStyleConfig('FormError', props)

  return (
    <ChakraFormErrorMessage alignItems="top" {...props}>
      <FormErrorIcon
        h={lineHeight as IconProps['height']}
        as={ErrorCircleSolid}
      />
      {children}
    </ChakraFormErrorMessage>
  )
}
