import { anatomy, getColor } from '@chakra-ui/theme-tools'

import { ComponentMultiStyleConfig } from '~theme/types'

import { Input } from '../Input'

export const ATTACHMENT_THEME_KEY = 'AttachmentField'

const parts = anatomy('attachment').parts('container', 'dropzone', 'icon')

export const Attachment: ComponentMultiStyleConfig<typeof parts> = {
  parts: parts.keys,
  baseStyle: {
    dropzone: {
      transitionProperty: 'common',
      transitionDuration: 'normal',
    },
  },
  sizes: {
    md: {
      icon: {
        fontSize: '3.5rem',
      },
      dropzone: {
        px: '3rem',
        py: '4rem',
      },
    },
  },
  variants: {
    // Variant is required to pass props to the theme.
    outline: (props) => {
      const {
        isDragActive,
        focusBorderColor: fc,
        errorBorderColor: ec,
        theme,
      } = props

      const inputStyle = Input.variants.outline(props).field

      return {
        dropzone: {
          textStyle: 'body-1',
          color: 'secondary.500',
          display: 'flex',
          flexDir: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          border: '1px dashed',
          borderColor: 'primary.700',
          borderRadius: '0.25rem',
          bg: isDragActive ? 'primary.200' : 'neutral.100',
          _invalid: {
            // Remove extra 1px of outline.
            borderColor: getColor(theme, ec),
            boxShadow: 'none',
          },
          _focus: {
            border: '1px solid',
            borderColor: getColor(theme, fc),
            boxShadow: `0 0 0 1px ${getColor(theme, fc)} !important`,
          },
          _disabled: {
            ...inputStyle._disabled,
          },
          _hover: {
            bg: 'primary.100',
          },
          _active: {
            bg: 'primary.200',
          },
        },
      }
    },
  },
  defaultProps: {
    ...Input.defaultProps,
  },
}
