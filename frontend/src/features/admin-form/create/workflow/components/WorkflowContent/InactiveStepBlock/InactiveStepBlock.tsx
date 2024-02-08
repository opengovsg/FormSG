import { useCallback, useMemo } from 'react'
import { BiTrash } from 'react-icons/bi'
import { Box, chakra, Flex, Stack, Text } from '@chakra-ui/react'

import { FormWorkflowStepDto } from '~shared/types/form'

import IconButton from '~components/IconButton'

import {
  createOrEditDataSelector,
  setToEditingSelector,
  useAdminWorkflowStore,
} from '../../../adminWorkflowStore'
import { StepLabel } from '../StepLabel'
import { isFirstStepByStepNumber } from '../utils/isFirstStepByStepNumber'

import { EmailBadge } from './EmailBadge'

interface InactiveStepBlockProps {
  stepNumber: number
  step: FormWorkflowStepDto
  handleOpenDeleteModal: () => void
}

export const InactiveStepBlock = ({
  stepNumber,
  step,
  handleOpenDeleteModal,
}: InactiveStepBlockProps): JSX.Element | null => {
  const setToEditing = useAdminWorkflowStore(setToEditingSelector)
  const stateData = useAdminWorkflowStore(createOrEditDataSelector)

  // Prevent editing logic if some other logic block is being edited.
  const isPreventEdit = useMemo(() => !!stateData, [stateData])

  const handleClick = useCallback(() => {
    if (isPreventEdit) {
      return
    }
    setToEditing(stepNumber)
  }, [isPreventEdit, stepNumber, setToEditing])

  const isFirstStep = isFirstStepByStepNumber(stepNumber)

  return (
    <Box pos="relative">
      <chakra.button
        type="button"
        w="100%"
        textAlign="start"
        borderRadius="4px"
        bg="white"
        border="1px solid"
        borderColor="neutral.300"
        transitionProperty="common"
        transitionDuration="normal"
        cursor={isPreventEdit ? 'not-allowed' : 'pointer'}
        disabled={isPreventEdit}
        aria-disabled={isPreventEdit}
        _hover={{
          _disabled: {
            bg: 'white',
          },
          bg: 'primary.100',
        }}
        _focus={{
          boxShadow: `0 0 0 4px var(--chakra-colors-primary-300)`,
        }}
        onClick={handleClick}
      >
        <Stack spacing="1.5rem" p={{ base: '1.5rem', md: '2rem' }}>
          <StepLabel stepNumber={stepNumber} />
          <Stack>
            <Text textStyle="subhead-3">Respondent in this step</Text>
            {isFirstStep ? (
              <Text>Anyone you share the form link with</Text>
            ) : (
              <Flex
                flexDir={{ base: 'column', md: 'row' }}
                gap={{ base: '0.5rem', md: '1rem' }}
                rowGap={{ md: '0.5rem' }}
                wrap="wrap"
              >
                {step.emails.map((email) => (
                  <EmailBadge>{email}</EmailBadge>
                ))}
              </Flex>
            )}
          </Stack>
        </Stack>
      </chakra.button>
      {!isFirstStep && (
        <IconButton
          top={{ base: '0.5rem', md: '2rem' }}
          right={{ base: '0.5rem', md: '2rem' }}
          pos="absolute"
          aria-label="Delete step"
          variant="clear"
          colorScheme="danger"
          onClick={handleOpenDeleteModal}
          icon={<BiTrash fontSize="1.5rem" />}
        />
      )}
    </Box>
  )
}
