import { BiPlus } from 'react-icons/bi'
import { Flex, Text } from '@chakra-ui/react'

import { useIsMobile } from '~hooks/useIsMobile'
import { fillHeightCss } from '~utils/fillHeightCss'
import Button from '~components/Button'

import { EmptyWorkspaceSvgr } from './EmptyWorkspaceSvgr'

export interface EmptyWorkspacePage {
  isLoading: boolean
  handleOpenCreateFormModal?: () => void
}

interface EmptyWorkspaceProps extends EmptyWorkspacePage {
  title: string
  subText: string
}

export const EmptyWorkspace = ({
  isLoading,
  handleOpenCreateFormModal,
  title,
  subText,
}: EmptyWorkspaceProps): JSX.Element => {
  const isMobile = useIsMobile()

  return (
    <Flex
      justify="flex-start"
      flexDir="column"
      align="center"
      px="2rem"
      py="4rem"
      bg="neutral.100"
      css={fillHeightCss}
    >
      <Text
        as="h2"
        textStyle="h2"
        color="primary.500"
        mb="1rem"
        textAlign="center"
      >
        {title}
      </Text>
      <Text textStyle="body-1" color="secondary.500" textAlign="center">
        {subText}
      </Text>
      {!!handleOpenCreateFormModal && (
        <Button
          isFullWidth={isMobile}
          isDisabled={isLoading}
          onClick={handleOpenCreateFormModal}
          leftIcon={<BiPlus fontSize="1.5rem" />}
          mt={{ base: '2.5rem', md: '2rem' }}
        >
          Create form
        </Button>
      )}
      <EmptyWorkspaceSvgr
        mt={{ base: '2.5rem', md: '3.5rem' }}
        w={{ base: '184px', md: '354px' }}
        maxW="100%"
      />
    </Flex>
  )
}
