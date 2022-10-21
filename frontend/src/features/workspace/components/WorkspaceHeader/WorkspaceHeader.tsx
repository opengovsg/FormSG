import { BiPlus } from 'react-icons/bi'
import { Skeleton, Stack, Text } from '@chakra-ui/react'

import { useIsMobile } from '~hooks/useIsMobile'
import Button from '~components/Button'

import { useWorkspaceContext } from '~features/workspace/WorkspaceContext'

export interface WorkspaceHeaderProps {
  handleOpenCreateFormModal: () => void
}

/**
 * Header for listing number of forms, or updating the sort order of listed forms, etc.
 */
export const WorkspaceHeader = ({
  handleOpenCreateFormModal,
}: WorkspaceHeaderProps): JSX.Element => {
  const isMobile = useIsMobile()
  const { isLoading, totalFormsCount, displayedFormsCount, isFilterOn } =
    useWorkspaceContext()

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
        {isFilterOn ? (
          <>
            Showing{' '}
            <Skeleton isLoaded={!isLoading}>{displayedFormsCount}</Skeleton> of{' '}
            <Skeleton isLoaded={!isLoading}>
              {totalFormsCount ?? '---'}
            </Skeleton>{' '}
            forms
          </>
        ) : (
          <>
            All forms (
            <Skeleton isLoaded={!isLoading}>
              {totalFormsCount ?? '---'}
            </Skeleton>
            )
          </>
        )}
      </Text>
      <Stack
        w={{ base: '100%', md: 'auto' }}
        spacing="1rem"
        direction={{ base: 'column', md: 'row' }}
        h="fit-content"
      >
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
