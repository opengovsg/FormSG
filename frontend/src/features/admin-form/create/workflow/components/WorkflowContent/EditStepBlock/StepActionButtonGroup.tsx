import { useTranslation } from 'react-i18next'
import { BiTrash } from 'react-icons/bi'
import { ButtonGroup, Flex } from '@chakra-ui/react'

import IconButton from '~components/IconButton'
import Tooltip from '~components/Tooltip'

interface StepActionButtonGroupProps {
  handleDelete: () => void
  isLoading: boolean
}

export const StepActionButtonGroup = ({
  handleDelete,
  isLoading,
}: StepActionButtonGroupProps): JSX.Element => {
  const { t } = useTranslation()

  return (
    <Flex
      px={{ base: '0.75rem', md: '1.5rem' }}
      flex={1}
      borderTop="1px solid var(--chakra-colors-neutral-300)"
      justify="flex-end"
    >
      <ButtonGroup variant="clear" colorScheme="secondary" spacing={0}>
        <Tooltip label="Delete step">
          <IconButton
            colorScheme="danger"
            aria-label="Delete step"
            icon={<BiTrash fontSize="1.25rem" />}
            onClick={handleDelete}
            isDisabled={isLoading}
          />
        </Tooltip>
      </ButtonGroup>
    </Flex>
  )
}
