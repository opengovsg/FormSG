import { BiHomeAlt } from 'react-icons/bi'
import { Icon, Skeleton, Stack, Text } from '@chakra-ui/react'

import { useIsMobile } from '~hooks/useIsMobile'
import Link from '~components/Link'

import { AdminFormNavbarProps } from './AdminFormNavbar'

type AdminFormNavbarDetailsProps = Pick<
  AdminFormNavbarProps,
  'formInfo' | 'handleBackButtonClick'
>

export const AdminFormNavbarBreadcrumbs = ({
  formInfo,
  handleBackButtonClick,
}: AdminFormNavbarDetailsProps): JSX.Element => {
  const isMobile = useIsMobile()

  return (
    // One day, in a distant future, when we upgrade to Chakra v2, this could be an
    // actual chakra Breadcrumb component. Until that day comes, I'm just doing this.
    // Background: Breadcrumb renders a nested <nav><ol>..., and if we want long form names to
    // have ellipses properly, we need to style the inner <ol> with display: flex, which I can't.
    <Stack
      direction="row"
      textStyle="body-1"
      overflow="hidden"
      spacing="0.5rem"
    >
      <Link
        whiteSpace="nowrap"
        textDecorationLine="none"
        onClick={handleBackButtonClick}
      >
        {isMobile ? <Icon as={BiHomeAlt} /> : 'All forms'}
      </Link>

      <Text color="secondary.300">/</Text>

      <Skeleton overflow="hidden" isLoaded={!!formInfo}>
        <Text
          whiteSpace="nowrap"
          textOverflow="ellipsis"
          overflow="hidden"
          color="secondary.500"
        >
          {formInfo ? formInfo.title : 'Loading...'}
        </Text>
      </Skeleton>
    </Stack>
  )
}
