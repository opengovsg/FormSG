import { ComponentMultiStyleConfig } from '@chakra-ui/theme'

export const Attachment: ComponentMultiStyleConfig = {
  parts: ['container', 'icon', 'text', 'uploaded', 'delete'],
  baseStyle: (props) => {
    const { isDisabled } = props
    return {
      uploaded: {
        bgColor: 'primary.100',
        borderRadius: '0.25rem',
        // bottom padding is 12px/0.75rem only
        p: '1rem 1rem 0.75rem 1rem',
      },
      delete: {
        boxSize: '2.75rem',
        cursor: 'pointer',
        border: 'none',
      },
      container: {
        py: '2.5rem',
        px: '3rem',
        bgColor: 'neutral.100',
        border: '1px dashed',
        borderColor: 'neutral.700',
        borderRadius: '0.25rem',
        textColor: 'secondary.500',
        textStyle: 'legal',
        fill: 'secondary.500',
        _hover: {
          bgColor: 'primary.200',
          borderColor: 'primary.700',
          _disabled: {
            bgColor: 'neutral.200',
            borderColor: 'neutral.500',
            cursor: 'not-allowed',
          },
        },
        _focus: {
          boxShadow: '0 0 0 1px var(--chakra-colors-primary-500) !important',
          border: '1px solid',
          borderColor: 'primary.500',
        },
        _active: {
          bgColor: 'primary.100',
        },
        _disabled: {
          bgColor: 'neutral.200',
          borderColor: 'neutral.500',
          fill: 'neutral.500',
          textColor: 'neutral.500',
        },
      },
      icon: {
        boxSize: '3.5rem',
      },
      text: {
        textColor: isDisabled ? 'neutral.500' : 'primary.500',
      },
    }
  },
}
