import { ReactNode, useCallback } from 'react'
import { useIsMutating } from 'react-query'
import { BiLeftArrowAlt } from 'react-icons/bi'
import { Stack, Text } from '@chakra-ui/react'

import IconButton from '~components/IconButton'

import { CreatePageDrawerCloseButton } from '../../../common/CreatePageDrawer'
import {
  isDirtySelector,
  useDirtyWorkflowStore,
} from '../../useDirtyWorkflowStore'
import {
  setToInactiveSelector,
  useAdminWorkflowStore,
} from '../../adminWorkflowStore'

import { adminFormKeys } from '~features/admin-form/common/queries'

interface WorkflowDrawerContainerProps {
  title: string
  showBackButton?: boolean
  children: ReactNode
  isLoading?: boolean // ADD THIS LINE
}

export const WorkflowDrawerContainer = ({
  title,
  showBackButton = false,
  children,
  isLoading = false, // ADD THIS LINE
}: WorkflowDrawerContainerProps): JSX.Element => {
  const isDirty = useDirtyWorkflowStore(isDirtySelector)
  const setToInactive = useAdminWorkflowStore(setToInactiveSelector)
  const isMutating = useIsMutating({ mutationKey: adminFormKeys.base }) // ADD THIS LINE
  const handleBack = useCallback(() => {
    setToInactive(isDirty)
  }, [isDirty, setToInactive])

  return (
    <>
      <Stack
        direction="row"
        pos="sticky"
        top={0}
        px="1.5rem"
        py="1rem"
        align="center"
        borderBottom="1px solid var(--chakra-colors-neutral-300)"
        bg="white"
      >
        {showBackButton && (
          <IconButton
            size="sm"
            h="1.5rem"
            w="1.5rem"
            aria-label="Back to workflow settings"
            variant="clear"
            colorScheme="secondary"
            onClick={handleBack}
            icon={<BiLeftArrowAlt />}
            isDisabled={isLoading || isMutating > 0} // ADD THIS LINE
          />
        )}
        <Text
          textStyle="h4"
          as="h4"
          color="secondary.500"
          flex={1}
          textAlign="center"
        >
          {title}
        </Text>
        <CreatePageDrawerCloseButton />
      </Stack>
      {children}
    </>
  )
}
