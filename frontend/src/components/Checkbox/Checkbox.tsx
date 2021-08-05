import {
  Checkbox as ChakraCheckbox,
  CheckboxProps as ChakraCheckboxProps,
  Icon,
  useMultiStyleConfig,
} from '@chakra-ui/react'

import { BxCheckAnimated } from '~/assets/icons'
import { CHECKBOX_THEME_KEY } from '~/theme/components/Checkbox'
import { FieldColorScheme } from '~/theme/foundations/colours'

export interface CheckboxProps extends ChakraCheckboxProps {
  colorScheme?: FieldColorScheme
}

export const Checkbox = ({
  children,
  colorScheme = 'primary',
  ...props
}: CheckboxProps): JSX.Element => {
  const { icon: iconStyles } = useMultiStyleConfig(CHECKBOX_THEME_KEY, {
    size: props.size,
  })
  return (
    <ChakraCheckbox
      icon={
        <Icon
          as={BxCheckAnimated}
          __css={iconStyles}
          // This prop needs to be passed explicitly for animations
          isChecked={props.isChecked}
        />
      }
      colorScheme={colorScheme}
      {...props}
    >
      {children}
    </ChakraCheckbox>
  )
}
