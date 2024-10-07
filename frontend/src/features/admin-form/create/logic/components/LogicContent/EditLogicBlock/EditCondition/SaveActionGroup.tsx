import { BiTrash } from 'react-icons/bi'
import { Box, Flex, Stack } from '@chakra-ui/react'

import { useIsMobile } from '~hooks/useIsMobile'
import Button from '~components/Button'
import IconButton from '~components/IconButton'

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
      px={{ base: '1.5rem', md: '2rem' }}
    >
      {handleDelete ? (
        <IconButton
          variant="clear"
          colorScheme="danger"
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
          isDisabled={isLoading}
          onClick={handleSubmit}
          isFullWidth={isMobile}
        >
          {submitButtonLabel}
        </Button>
        <Button
          variant="clear"
          colorScheme="secondary"
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
