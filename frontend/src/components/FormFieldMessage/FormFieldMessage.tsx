import { useMemo } from 'react'
import { FormHelperText, HelpTextProps, Icon } from '@chakra-ui/react'

import { CheckCircleSolid, ErrorCircleSolid } from '~assets/icons'

export interface FormFieldMessageProps extends HelpTextProps {
  /**
   * Variant of input message, determines the styling. Defaults to `info`.
   */
  variant?: 'error' | 'success' | 'info'

  /**
   * Font size of the icon (if any). Defaults to `md`.
   */
  iconFontSize?: HelpTextProps['fontSize']
}

export const FormFieldMessage = ({
  children,
  variant: type = 'info',
  iconFontSize = 'md',
  ...args
}: FormFieldMessageProps): JSX.Element => {
  const fontColor = useMemo(() => {
    switch (type) {
      case 'error':
        return 'danger.500'
      case 'success':
        return 'success.700'
      case 'info':
        return 'secondary.400'
    }
  }, [type])

  const icon = useMemo(() => {
    switch (type) {
      case 'error':
        return <Icon fontSize={iconFontSize} as={ErrorCircleSolid} mr={2} />
      case 'success':
        return <Icon fontSize={iconFontSize} as={CheckCircleSolid} mr={2} />
      case 'info':
        return undefined
    }
  }, [iconFontSize, type])

  return (
    <FormHelperText
      display="flex"
      alignItems="center"
      textStyle="body-2"
      color={fontColor}
      {...args}
    >
      {icon}
      {children}
    </FormHelperText>
  )
}
