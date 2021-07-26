/* eslint-disable @typescript-eslint/no-unused-vars */
import { ComponentMultiStyleConfig } from '@chakra-ui/theme'

export const Attachment: ComponentMultiStyleConfig = {
  parts: ['container', 'icon', 'text'],
  baseStyle: (props) => {
    // Double check on what happens with these 2 states
    // and hover + focus
    const { isDisabled, hasError } = props
    return {
      container: {
        // on click, we should only see active state
        // focus state should be hidden
        // this is not possible with boxshadow because it draws over
        py: '2.5rem',
        bgColor: 'neutral.100',
        border: '1px dashed',
        borderColor: 'neutral.700',
        borderRadius: '0.25rem',
        textColor: 'inherit',
        outline: '1px solid transparent',
        _hover: {
          bgColor: 'primary.200',
          borderColor: 'primary.700',
        },
        _focus: {
          boxShadow: '0 0 0 1px var(--chakra-colors-primary-500) !important',
          border: '1px solid',
          borderColor: 'primary.500',
        },
        _active: {
          bgColor: 'primary.100',
        },
      },
      icon: {
        boxSize: '3.5rem',
      },
      text: {
        textStyle: 'body-1',
        textColor: 'primary.500',
      },
    }
  },
  variants: {},
}
