import { BiX } from 'react-icons/bi'
import {
  chakra,
  forwardRef,
  HTMLChakraProps,
  Icon,
  SystemStyleObject,
  Tag,
  TagLabel,
  TagProps,
  useStyles,
} from '@chakra-ui/react'

export interface SelectedItemTagProps extends TagProps {
  label: string
  onRemove: () => void
}

export interface SelectedItemTagCloseButtonProps
  extends Omit<HTMLChakraProps<'button'>, 'disabled'> {
  isDisabled?: boolean
}

/** Not using Chakra's TagCloseButton due to inability to override aria-label */
const SelectedItemTagCloseButton = ({
  isDisabled,
  children,
  ...rest
}: SelectedItemTagCloseButtonProps): JSX.Element => {
  const styles = useStyles()

  const btnStyles: SystemStyleObject = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    outline: '0',
    ...styles.closeButton,
    opacity: 0.8,
    color: 'secondary.500',
    _focus: {
      boxShadow: '0 0 0 2px var(--chakra-colors-secondary-300)',
      bg: 'secondary.200',
    },
    _hover: { opacity: 0.9, color: 'secondary.600' },
    _active: { opacity: 1, color: 'secondary.700', bg: 'secondary.200' },
  }

  return (
    <chakra.button
      type="button"
      aria-label="Remove selected option"
      disabled={isDisabled}
      __css={btnStyles}
      {...rest}
    >
      <Icon as={BiX} fontSize="1.5rem" />
    </chakra.button>
  )
}

export const SelectedItemTag = forwardRef<SelectedItemTagProps, 'div'>(
  ({ label, onRemove, ...props }, ref): JSX.Element => {
    // TODO: Update Tag global theme instead of styling it in this component.
    return (
      <Tag
        title={label}
        colorScheme="secondary"
        px="0.5rem"
        py="0.375rem"
        color="secondary.500"
        {...props}
      >
        <TagLabel isTruncated ref={ref} textStyle="body-2">
          {label}
        </TagLabel>
        <SelectedItemTagCloseButton
          onClick={(e) => {
            e.stopPropagation()
            onRemove()
          }}
        />
      </Tag>
    )
  },
)
