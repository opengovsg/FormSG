import { ComponentStyleConfig } from '@chakra-ui/react'

export const Input: ComponentStyleConfig = {
  variants: {
    outline: (props) => ({
      field: {
        h: '44px',
        // textStyle: 'body-1',
        borderColor: 'neutral.400',
        border: '1px solid',
        borderRadius: '4px',
        _focus: {
          boxShadow: 'none',
          borderColor: 'primary.500',
          borderWidth: '2px',
        },
      },
    }),
  },
  defaultProps: {
    variant: 'outline',
  },
}
