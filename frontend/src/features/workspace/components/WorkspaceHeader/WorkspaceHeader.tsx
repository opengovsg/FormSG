import { useState } from 'react'
import { BiPlus } from 'react-icons/bi'
import { Skeleton, Stack, Text } from '@chakra-ui/react'

import { useIsMobile } from '~hooks/useIsMobile'
import Button from '~components/Button'

import { SortOption } from '~features/workspace/types'

import { WorkspaceSortDropdown } from './WorkspaceSortDropdown'

export interface WorkspaceHeaderProps {
  /**
   * Number of forms in the workspace.
   * Defaults to '---' (to account for loading or error states)
   */
  totalFormCount?: number | '---'
  isLoading: boolean
  handleOpenCreateFormModal: () => void
  handleOpenWhatsNewDrawer: () => void
  isWhatsNewButtonSolid: boolean
}

/**
 * Header for listing number of forms, or updating the sort order of listed forms, etc.
 */
export const WorkspaceHeader = ({
  totalFormCount = '---',
  isLoading,
  handleOpenCreateFormModal,
  handleOpenWhatsNewDrawer,
  isWhatsNewButtonSolid,
}: WorkspaceHeaderProps): JSX.Element => {
  const [sortOption, setSortOption] = useState(SortOption.LastUpdated)
  const isMobile = useIsMobile()

  const whatsNewButtonVariant = isWhatsNewButtonSolid ? 'solid' : 'outline'

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
        <WorkspaceSortDropdown
          value={sortOption}
          onChange={setSortOption}
          isDisabled={isLoading}
        />
        <Button
          isFullWidth={isMobile}
          isDisabled={isLoading}
          onClick={handleOpenCreateFormModal}
          leftIcon={<BiPlus fontSize="1.5rem" />}
        >
          Create form
        </Button>
        {/* TODO: Button with button variant prop is used temporarily to represent the what's new tab functionality in the admin header. 
        Shift this to admin header once admin header is implemented.*/}
        <Button
          isFullWidth={isMobile}
          onClick={handleOpenWhatsNewDrawer}
          variant={whatsNewButtonVariant}
        >
          What's New
        </Button>
      </Stack>
    </Stack>
  )
}
