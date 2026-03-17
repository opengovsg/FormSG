import { useTranslation } from 'react-i18next'
import { BiHomeAlt } from 'react-icons/bi'
import { Link as ReactLink } from 'react-router-dom'
import { Icon, Skeleton, Stack, Text } from '@chakra-ui/react'

import { DASHBOARD_ROUTE } from '~constants/routes'
import { useIsMobile } from '~hooks/useIsMobile'
import Link from '~components/Link'

import { AdminFormNavbarProps } from './AdminFormNavbar'

type AdminFormNavbarDetailsProps = Pick<AdminFormNavbarProps, 'formInfo'>

export const AdminFormNavbarBreadcrumbs = ({
  formInfo,
}: AdminFormNavbarDetailsProps): JSX.Element => {
  const { t } = useTranslation()
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
        as={ReactLink}
        whiteSpace="nowrap"
        textDecorationLine="none"
        to={DASHBOARD_ROUTE}
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
          {formInfo ? formInfo.title : t('features.common.loadingWithEllipsis')}
        </Text>
      </Skeleton>
    </Stack>
  )
}
