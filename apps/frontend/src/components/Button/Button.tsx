import {
  Button as ChakraButton,
  ButtonProps as ChakraButtonProps,
  forwardRef,
  IconProps,
} from '@chakra-ui/react'

import Spinner from '../Spinner'

export interface ButtonProps extends ChakraButtonProps {
  /**
   * Loading spinner font size. Defaults to `1.5rem`.
   */
  spinnerFontSize?: IconProps['fontSize']
  /**
   * Base color intensity of button.
   */
  basecolorintensity?: 500 | 600

  /**
   * @note backwards compatibility with Chakra V1
   */
  isFullWidth?: boolean

  isHighContrast?: boolean
}

export const Button = forwardRef<ButtonProps, 'button'>(
  (
    {
      children,
      spinnerFontSize,
      isFullWidth,
      isHighContrast,
      loadingText,
      ...props
    },
    ref,
  ) => {
    const spinner = <Spinner fontSize={spinnerFontSize ?? '1.5rem'} />

    // Chakra renders loadingText as a raw text node sibling to the spinner
    // when isLoading is true. Wrap in a span for the same reason as
    // children below.
    const wrappedLoadingText =
      loadingText !== undefined ? <span>{loadingText}</span> : undefined

    return (
      <ChakraButton
        ref={ref}
        spinner={spinner}
        loadingText={wrappedLoadingText}
        width={isFullWidth ? '100%' : undefined}
        {...props}
        {...(isFullWidth ? { minH: '3.5rem' } : {})}
        {...(isHighContrast ? { variant: 'highContrast' } : {})}
      >
        {/* Span wrapper prevents Chrome's translation engine from directly
            modifying button text nodes, which breaks React reconciliation
            when the button switches to its loading state. */}
        <span>{children}</span>
      </ChakraButton>
    )
  },
)
