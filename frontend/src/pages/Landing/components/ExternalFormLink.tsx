import { BiLayout } from 'react-icons/bi'
import { Icon } from '@chakra-ui/react'

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
    <Link isExternal href={href} minW="25rem">
      <Icon
        mr="1rem"
        color="secondary.500"
        fontSize="1.5rem"
        as={BiLayout}
        aria-hidden
      />
      {label}
    </Link>
  )
}
