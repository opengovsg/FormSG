import { BiX } from 'react-icons/bi'
import { chakra, Flex, Icon, Image } from '@chakra-ui/react'

import { ReactComponent as BrandMarkSvg } from '~assets/svgs/brand/brand-mark-colour.svg'

import { useDirectoryAgencies } from '../queries'

const BrandSmallLogo = chakra(BrandMarkSvg)

export const DirectoryResultsLogo = ({ agency }: { agency: string }) => {
  const { data: agencies } = useDirectoryAgencies()

  const agencyImgSrc = agencies?.find(
    ({ shortName }) => shortName === agency,
  )?.logo

  return (
    <Flex alignItems="center" gap="0.5rem">
      <BrandSmallLogo minW="3rem" />
      <Icon as={BiX} fontSize="1.5rem" />
      <Image src={agencyImgSrc} h="3rem" />
    </Flex>
  )
}
