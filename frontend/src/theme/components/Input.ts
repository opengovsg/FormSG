import { ComponentStyleConfig } from '@chakra-ui/react'

export const Input: ComponentStyleConfig = {
  variants: {
    outline: (props) => ({
      field: {
        h: '2.75rem',
        py: '0.625rem',
        px: '1rem',
        textStyle: 'body-1',
        borderColor: 'neutral.400',
        border: '1px solid',
        borderRadius: '0.25rem',
        _placeholder: {
          color: 'neutral.500',
        },
        _disabled: {
          background: 'neutral.200',
          borderColor: 'neutral.400',
        },
        _invalid: {
          // Remove extra 1px of outline.
          boxShadow: 'none',
        },
      },
    }),
  },
  defaultProps: {
    variant: 'outline',
    focusBorderColor: 'primary.500',
    errorBorderColor: 'danger.500',
  },
}
