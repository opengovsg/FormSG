import { ComponentMultiStyleConfig } from '@chakra-ui/theme'

export const Attachment: ComponentMultiStyleConfig = {
  parts: ['container', 'icon', 'text', 'uploaded', 'delete'],
  baseStyle: (props) => {
    const { isDisabled, isDragActive } = props
    return {
      uploaded: {
        bgColor: 'primary.100',
        borderRadius: '0.25rem',
        p: '0.875rem 1rem',
      },
      delete: {
        cursor: 'pointer',
        border: 'none',
        color: 'danger.500',
      },
      container: {
        width: '100%',
        py: '2.5rem',
        px: '3rem',
        bgColor: isDragActive ? 'primary.100' : 'neutral.100',
        border: '1px dashed',
        borderColor: isDragActive ? 'primary.700' : 'neutral.700',
        borderRadius: '0.25rem',
        textColor: 'secondary.500',
        textStyle: 'legal',
        fill: 'secondary.500',
        _hover: {
          bgColor: 'primary.100',
          borderColor: 'primary.700',
          _disabled: {
            bgColor: 'neutral.200',
            borderColor: 'neutral.500',
            cursor: 'not-allowed',
          },
        },
        _focus: {
          boxShadow: '0 0 0 1px var(--chakra-colors-primary-500) !important',
          borderStyle: 'solid',
          borderColor: 'primary.500',
        },
        _active: {
          bgColor: 'primary.200',
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
