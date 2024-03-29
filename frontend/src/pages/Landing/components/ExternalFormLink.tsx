import { BiLayout } from 'react-icons/bi'
import { Flex, Icon } from '@chakra-ui/react'

import Link from '~components/Link'

export interface ExternalFormLinkProps {
  href: string
  label: string
}

export const ExternalFormLink = ({
  href,
  label,
}: ExternalFormLinkProps): JSX.Element => {
  return (
    <Flex>
      <Icon
        mr="1rem"
        color="secondary.500"
        fontSize="1.5rem"
        as={BiLayout}
        aria-hidden
      />
      <Link display="inline-block" isExternal href={href}>
        {label}
      </Link>
    </Flex>
  )
}
