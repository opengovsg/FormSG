import {
  Button as ChakraButton,
  ButtonProps as ChakraButtonProps,
  forwardRef,
  IconProps,
} from '@chakra-ui/react'
import { useGrowthBook } from '@growthbook/growthbook-react'

import { featureFlags } from '~shared/constants'

import { OgpLogo } from '~assets/svgrs/brand/OgpLogo'

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
    { children, spinnerFontSize, isFullWidth, isHighContrast, ...props },
    ref,
  ) => {
    const gb = useGrowthBook()

    // Ensures compatibility between Chakra size definitions and those supported by the SVG logo
    const spinnerSize =
      typeof spinnerFontSize === 'string' || typeof spinnerFontSize === 'number'
        ? spinnerFontSize
        : '1.5rem'

    const spinner = gb?.isOn(featureFlags.ogpSpinner) ? (
      <Spinner
        fontSize={spinnerFontSize ?? '1.5rem'}
        speed="1s"
        element={<OgpLogo height={spinnerSize} fill="primary" />}
      />
    ) : (
      <Spinner fontSize={spinnerFontSize ?? '1.5rem'} />
    )

    return (
      <ChakraButton
        ref={ref}
        spinner={spinner}
        width={isFullWidth ? '100%' : undefined}
        {...props}
        {...(isFullWidth ? { minH: '3.5rem' } : {})}
        {...(isHighContrast ? { variant: 'highContrast' } : {})}
      >
        {children}
      </ChakraButton>
    )
  },
)
