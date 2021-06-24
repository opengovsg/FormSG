import { FormHelperText, HelpTextProps, Icon } from '@chakra-ui/react'

import { CheckCircleSolid } from '~assets/icons'

export interface FormFieldMessageProps extends HelpTextProps {
  /**
   * Variant of input message, determines the styling. Defaults to `info`.
   */
  variant?: 'success' | 'info'
}

/**
 * @precondition This element should be instantiated as a child of ChakraUI's `FormControl` element.
 *
 * An assistive component that conveys additional guidance about the field, such
 * as how it will be used and what types in values should be provided.
 */
export const FormFieldMessage = ({
  children,
  variant = 'info',
  ...props
}: FormFieldMessageProps): JSX.Element => {
  const fontColor = variant === 'success' ? 'success.700' : 'secondary.400'
  return (
    <FormHelperText
      display="flex"
      alignItems="top"
      color={fontColor}
      {...props}
    >
      {variant === 'success' && (
        <Icon
          aria-hidden
          marginEnd="0.5em"
          color={fontColor}
          fontSize="1rem"
          h="1.5rem"
          as={CheckCircleSolid}
          mr={2}
        />
      )}
      {children}
    </FormHelperText>
  )
}
