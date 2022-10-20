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
      overflow="hidden"
      separator={<Text color="secondary.300">/</Text>}
    >
      <BreadcrumbItem whiteSpace="nowrap">
        <BreadcrumbLink color="primary.500" onClick={handleBackButtonClick}>
          {isMobile ? <Icon as={BiHomeAlt} mb="-2px" /> : 'All forms'}
        </BreadcrumbLink>
      </BreadcrumbItem>

      <BreadcrumbItem overflow="hidden">
        <Skeleton overflow="hidden" isLoaded={!!formInfo}>
          <Text whiteSpace="nowrap" textOverflow="ellipsis" overflow="hidden">
            {formInfo ? formInfo.title : 'Loading...'}
          </Text>
        </Skeleton>
      </BreadcrumbItem>
    </Breadcrumb>
  )
}
