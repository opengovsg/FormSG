import { BiX } from 'react-icons/bi'
import {
  chakra,
  forwardRef,
  Icon,
  IconProps,
  Tag as ChakraTag,
  TagCloseButtonProps as ChakraTagCloseButtonProps,
  TagProps as ChakraTagProps,
  useStyles,
} from '@chakra-ui/react'

export type TagProps = ChakraTagProps
// Chakra's css prop type conflict with emotion, but we don't use the css prop anyways.
export type TagIconProps = Omit<IconProps, 'css'>

export const TagLeftIcon = forwardRef<TagIconProps, 'svg'>((props, ref) => {
  const styles = useStyles()
  return (
    <Icon
      ref={ref}
      verticalAlign="top"
      marginStart={0}
      {...props}
      __css={styles.icon}
    />
  )
})
export const TagRightIcon = forwardRef<TagIconProps, 'svg'>((props, ref) => {
  const styles = useStyles()
  return (
    <Icon
      ref={ref}
      verticalAlign="top"
      marginEnd={0}
      {...props}
      __css={styles.icon}
    />
  )
})

const TagCloseIcon = () => (
  <Icon as={BiX} fontSize="1.5rem" aria-label="Remove option icon" />
)

export type TagCloseButtonProps = ChakraTagCloseButtonProps
/** Not using Chakra's TagCloseButton due to inability to override aria-label */
export const TagCloseButton = ({
  isDisabled,
  children,
  ...rest
}: TagCloseButtonProps): JSX.Element => {
  const styles = useStyles()

  return (
    <chakra.button
      type="button"
      aria-label="Remove selected option"
      disabled={isDisabled}
      __css={styles.closeButton}
      {...rest}
    >
      {children || <TagCloseIcon />}
    </chakra.button>
  )
}

export const Tag = forwardRef<TagProps, 'span'>((props, ref): JSX.Element => {
  return <ChakraTag {...props} ref={ref} />
})
