import { BiHomeAlt } from 'react-icons/bi'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Icon,
  Skeleton,
  Text,
} from '@chakra-ui/react'

import { useIsMobile } from '~hooks/useIsMobile'

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
    <Breadcrumb
      textStyle="body-1"
      color="secondary.500"
      noOfLines={1}
      alignItems="center"
      separator={<Text color="secondary.300">/</Text>}
    >
      <BreadcrumbItem>
        <BreadcrumbLink color="primary.500" onClick={handleBackButtonClick}>
          {isMobile ? <Icon as={BiHomeAlt} mb="-2px" /> : 'All forms'}
        </BreadcrumbLink>
      </BreadcrumbItem>

      <BreadcrumbItem>
        <Skeleton isLoaded={!!formInfo}>
          <Text>{formInfo?.title}</Text>
        </Skeleton>
      </BreadcrumbItem>
    </Breadcrumb>
  )
}
