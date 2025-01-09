import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { BiLoader } from 'react-icons/bi'
import {
  Flex,
  FlexProps,
  Icon,
  IconProps,
  keyframes,
  usePrefersReducedMotion,
  VisuallyHidden,
} from '@chakra-ui/react'

interface SpinnerProps extends FlexProps {
  /**
   * The color of the spinner
   */
  color?: string
  /**
   * The speed of the spinner.
   * @example
   * ```jsx
   * <Spinner speed="0.2s"/>
   * ```
   */
  speed?: string
  /**
   * For accessibility, it is important to add a fallback loading text.
   * This text will be visible to screen readers.
   */
  label?: string

  /**
   * Font size of the spinner.
   */
  fontSize?: IconProps['fontSize']
}

const spin = keyframes({
  '0%': {
    transform: 'rotate(0deg)',
  },
  '100%': {
    transform: 'rotate(360deg)',
  },
})

export const Spinner = ({
  speed = '2.5s',
  color = 'inherit',
  label: userSpecifiedLabel,
  fontSize = '1rem',
  ...flexProps
}: SpinnerProps): JSX.Element => {
  const { t } = useTranslation()
  const prefersReducedMotion = usePrefersReducedMotion()

  const animation = useMemo(
    () =>
      prefersReducedMotion ? undefined : `${spin} ${speed} linear infinite`,
    [prefersReducedMotion, speed],
  )

  const label = userSpecifiedLabel ?? t('features.common.loadingWithEllipsis')

  return (
    <Flex color={color} align="center" {...flexProps}>
      {label && <VisuallyHidden>{label}</VisuallyHidden>}
      <Icon
        animation={animation}
        as={BiLoader}
        fontSize={fontSize}
        aria-label="Spinner icon"
      />
    </Flex>
  )
}
