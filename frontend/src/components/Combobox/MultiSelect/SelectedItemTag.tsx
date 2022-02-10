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
import merge from 'lodash/merge'

export interface SelectedItemTagProps extends TagProps {
  label: string
  onRemove: () => void
  isDisabled?: boolean
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

  const btnStyles: SystemStyleObject = merge(styles.closeButton, {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    outline: '0',
    opacity: 1,
    color: 'secondary.500',
    _focus: {
      boxShadow: '0 0 0 2px var(--chakra-colors-secondary-300)',
      bg: 'secondary.200',
    },
    _disabled: {
      opacity: 1,
      cursor: 'not-allowed',
      color: 'neutral.500',
      bg: 'transparent',
    },
    _hover: {
      color: 'secondary.600',
      opacity: 1,
      _disabled: { color: 'neutral.500' },
    },
    _active: {
      opacity: 1,
      color: 'secondary.700',
      bg: 'secondary.200',
      _disabled: {
        bg: 'transparent',
      },
    },
  })

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
  ({ label, onRemove, isDisabled, ...props }, ref): JSX.Element => {
    // TODO: Update Tag global theme instead of styling it in this component.
    return (
      <Tag
        _focus={{ boxShadow: '0 0 0 2px var(--chakra-colors-secondary-300)' }}
        title={label}
        h="2rem"
        colorScheme="secondary"
        px="0.5rem"
        py="0.375rem"
        color="secondary.500"
        m="2px"
        {...props}
        ref={ref}
      >
        <TagLabel isTruncated textStyle="body-2">
          {label}
        </TagLabel>
        <SelectedItemTagCloseButton
          isDisabled={isDisabled}
          onClick={(e) => {
            e.stopPropagation()
            onRemove()
          }}
        />
      </Tag>
    )
  },
)
