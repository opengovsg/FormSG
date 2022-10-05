import { BiPlus } from 'react-icons/bi'
import { Box, Flex, Text } from '@chakra-ui/react'

import { useIsMobile } from '~hooks/useIsMobile'
import { fillHeightCss } from '~utils/fillHeightCss'
import Button from '~components/Button'

// TODO #4279: Remove after React rollout is complete
import { AdminSwitchEnvMessage } from '../AdminSwitchEnvMessage'

import { EmptyWorkspaceSvgr } from './EmptyWorkspaceSvgr'

export interface EmptyWorkspacePage {
  isLoading: boolean
  handleOpenCreateFormModal: () => void
}

export const EmptyWorkspace = ({
  isLoading,
  handleOpenCreateFormModal,
}: EmptyWorkspacePage): JSX.Element => {
  const isMobile = useIsMobile()

  return (
    <Flex
      justify="flex-start"
      flexDir="column"
      align="center"
      px="2rem"
      py="1rem"
      bg="neutral.100"
      css={fillHeightCss}
    >
      <Box pb="1.5rem">
        <AdminSwitchEnvMessage />
      </Box>
      <Text as="h2" textStyle="h2" color="primary.500" mb="1rem">
        You don't have any forms yet
      </Text>
      <Text
        textStyle="body-1"
        color="secondary.500"
        mb={{ base: '2.5rem', md: '2rem' }}
      >
        Get started by creating a new form
      </Text>
      <Button
        isFullWidth={isMobile}
        isDisabled={isLoading}
        onClick={handleOpenCreateFormModal}
        leftIcon={<BiPlus fontSize="1.5rem" />}
      >
        Create form
      </Button>
      <EmptyWorkspaceSvgr
        mt={{ base: '2.5rem', md: '3.5rem' }}
        w={{ base: '184px', md: '354px' }}
        maxW="100%"
      />
    </Flex>
  )
}
