import { BiTrash } from 'react-icons/bi'
import { Box, Flex, Stack } from '@chakra-ui/react'
import { Button, IconButton } from '@opengovsg/design-system-react'

import { useIsMobile } from '~hooks/useIsMobile'

export interface SaveActionGroupProps {
  handleCancel: () => void
  handleDelete?: () => void
  handleSubmit: () => void
  submitButtonLabel?: string
  isLoading: boolean
  ariaLabelName: string
}

export const SaveActionGroup = ({
  submitButtonLabel = 'Save changes',
  handleCancel,
  handleDelete,
  handleSubmit,
  isLoading,
  ariaLabelName,
}: SaveActionGroupProps): JSX.Element => {
  const isMobile = useIsMobile()

  return (
    <Flex
      justify="space-between"
      align="center"
      py="0.375rem"
      px={{ base: '1rem', md: '2rem' }}
      borderTop="1px solid"
      borderColor="base.divider.medium"
    >
      {handleDelete ? (
        <IconButton
          variant="clear"
          colorScheme="critical"
          aria-label={`Delete ${ariaLabelName}`}
          icon={<BiTrash />}
          onClick={handleDelete}
          isDisabled={isLoading}
        />
      ) : (
        <Box />
      )}
      <Stack
        spacing="1rem"
        direction={{ base: 'column', md: 'row-reverse' }}
        w="100%"
      >
        <Button
          isLoading={isLoading}
          onClick={handleSubmit}
          isFullWidth={isMobile}
        >
          {submitButtonLabel}
        </Button>
        <Button
          variant="clear"
          colorScheme="sub"
          isDisabled={isLoading}
          onClick={handleCancel}
          isFullWidth={isMobile}
        >
          Cancel
        </Button>
      </Stack>
    </Flex>
  )
}
