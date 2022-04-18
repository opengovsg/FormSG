import { BiTrash } from 'react-icons/bi'
import { Box, ButtonGroup, Flex } from '@chakra-ui/react'

import Button from '~components/Button'
import IconButton from '~components/IconButton'

export interface SaveActionGroupProps {
  handleCancel: () => void
  handleDelete?: () => void
  handleSubmit: () => void
  submitButtonLabel?: string
  isLoading: boolean
}

export const SaveActionGroup = ({
  submitButtonLabel = 'Save changes',
  handleCancel,
  handleDelete,
  handleSubmit,
  isLoading,
}: SaveActionGroupProps): JSX.Element => {
  return (
    <Flex
      justify="space-between"
      align="center"
      py="0.375rem"
      px={{ base: '1rem', md: '2rem' }}
      borderTop="1px solid"
      borderColor="neutral.300"
    >
      {handleDelete ? (
        <IconButton
          variant="clear"
          colorScheme="danger"
          aria-label="Delete logic"
          icon={<BiTrash />}
          onClick={handleDelete}
          isDisabled={isLoading}
        />
      ) : (
        <Box />
      )}
      <ButtonGroup spacing="1rem">
        <Button variant="clear" colorScheme="secondary" onClick={handleCancel}>
          Cancel
        </Button>
        <Button isLoading={isLoading} onClick={handleSubmit}>
          {submitButtonLabel}
        </Button>
      </ButtonGroup>
    </Flex>
  )
}
