import { BiPlus } from 'react-icons/bi'
import { Skeleton, Stack, Text } from '@chakra-ui/react'

import { useIsMobile } from '~hooks/useIsMobile'
import Button from '~components/Button'

export interface WorkspaceHeaderProps {
  /**
   * Number of forms in the workspace.
   * Defaults to '---' (to account for loading or error states)
   */
  totalFormCount?: number | '---'
  isLoading: boolean
  handleOpenCreateFormModal: () => void
}

/**
 * Header for listing number of forms, or updating the sort order of listed forms, etc.
 */
export const WorkspaceHeader = ({
  totalFormCount = '---',
  isLoading,
  handleOpenCreateFormModal,
}: WorkspaceHeaderProps): JSX.Element => {
  const isMobile = useIsMobile()

  return (
    <Stack
      justify="space-between"
      direction={{ base: 'column', md: 'row' }}
      align={{ base: 'flex-start', md: 'center' }}
      spacing="1rem"
    >
      <Text
        flex={1}
        as="h2"
        textStyle="h2"
        display="flex"
        color="secondary.500"
      >
        All forms (<Skeleton isLoaded={!isLoading}>{totalFormCount}</Skeleton>)
      </Text>
      <Stack
        w={{ base: '100%', md: 'auto' }}
        spacing="1rem"
        direction={{ base: 'column', md: 'row' }}
        h="fit-content"
      >
        {/* Future: add form sorting dropdown here, can use WorkspaceSortDropdown component */}
        <Button
          isFullWidth={isMobile}
          isDisabled={isLoading}
          onClick={handleOpenCreateFormModal}
          leftIcon={<BiPlus fontSize="1.5rem" />}
        >
          Create form
        </Button>
      </Stack>
    </Stack>
  )
}
