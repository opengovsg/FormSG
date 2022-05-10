import { BiLinkExternal } from 'react-icons/bi'
import {
  ComponentWithAs,
  forwardRef,
  Icon,
  Link as ChakraLink,
  LinkProps as ChakraLinkProps,
  Text,
  useStyleConfig,
} from '@chakra-ui/react'

export interface LinkProps extends ChakraLinkProps {
  externalLinkIcon?: React.ReactElement
  isDisabled?: boolean
}

type LinkWithParts = ComponentWithAs<'a', LinkProps> & {
  ExternalIcon: typeof ExternalIcon
}

export const Link = forwardRef<LinkProps, 'a'>(
  (
    {
      externalLinkIcon = <Link.ExternalIcon />,
      isDisabled,
      children,
      ...props
    },
    ref,
  ) => {
    const styles = useStyleConfig('Link', props)

    if (isDisabled) {
      return (
        <Text
          as="a"
          ref={ref}
          sx={props.sx ?? styles}
          aria-disabled
          d="inline-flex"
          alignItems="center"
        >
          {children}
          {props.isExternal && externalLinkIcon}
        </Text>
      )
    }

    return (
      <ChakraLink d="inline-flex" alignItems="center" {...props} ref={ref}>
        {children}
        {props.isExternal && externalLinkIcon}
      </ChakraLink>
    )
  },
) as LinkWithParts

const ExternalIcon = (): JSX.Element => {
  return (
    <Icon aria-hidden as={BiLinkExternal} ml="0.25rem" verticalAlign="middle" />
  )
}

Link.ExternalIcon = ExternalIcon
