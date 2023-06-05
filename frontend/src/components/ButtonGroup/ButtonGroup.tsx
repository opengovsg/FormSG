import {
  ButtonGroup as CharkaButtonGroup,
  ButtonGroupProps as ChakraButtonGroupProps,
} from '@chakra-ui/react'

export interface ButtonGroupProps extends ChakraButtonGroupProps {
  /**
   * If `true`, the button group will take up the full width of its container,
   * and its children (<Button />) will be arranged in the reverse order
   */
  isFullWidth: boolean
}

export const ButtonGroup = ({
  isFullWidth,
  children,
  ...rest
}: ButtonGroupProps) => {
  const buttonGrpResponsiveLayoutProps = isFullWidth
    ? ({
        flexDir: 'column-reverse',
        w: '100%',
        spacing: 0,
        pt: '2rem',
        rowGap: '0.75rem',
      } as const)
    : ({} as const)
  return (
    <CharkaButtonGroup {...buttonGrpResponsiveLayoutProps} {...rest}>
      {children}
    </CharkaButtonGroup>
  )
}
