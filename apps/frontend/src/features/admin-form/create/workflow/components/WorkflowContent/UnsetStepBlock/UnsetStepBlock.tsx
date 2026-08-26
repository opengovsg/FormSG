import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { BiPlus } from 'react-icons/bi'
import { Box, chakra, Icon, Stack, Text } from '@chakra-ui/react'

import {
  createOrEditDataSelector,
  requestSwitchToSelector,
  setToEditingSelector,
  useAdminWorkflowStore,
} from '../../../adminWorkflowStore'
import { StepLabel } from '../StepLabel'

interface UnsetStepBlockProps {
  stepNumber: number
}

/**
 * The slot left behind when step 1 is deleted.
 *
 * It holds position 1 so the steps behind it keep their numbers, and clicking
 * it opens the same editor as any other step, which saves over the slot rather
 * than adding a step at the end.
 */
export const UnsetStepBlock = ({
  stepNumber,
}: UnsetStepBlockProps): JSX.Element => {
  const { t } = useTranslation()
  const setToEditing = useAdminWorkflowStore(setToEditingSelector)
  const stateData = useAdminWorkflowStore(createOrEditDataSelector)
  const requestSwitchTo = useAdminWorkflowStore(requestSwitchToSelector)

  const handleClick = useCallback(() => {
    if (stateData) {
      // Another step is open: auto-save it and switch here.
      requestSwitchTo(stepNumber)
      return
    }
    setToEditing(stepNumber)
  }, [stateData, stepNumber, setToEditing, requestSwitchTo])

  return (
    <Box pos="relative" role="group">
      <chakra.button
        type="button"
        w="100%"
        textAlign="start"
        borderRadius="4px"
        bg="white"
        border="1px dashed"
        borderColor="neutral.400"
        transitionProperty="common"
        transitionDuration="normal"
        cursor="pointer"
        _groupHover={{ borderColor: 'primary.500', bg: 'primary.100' }}
        onClick={handleClick}
      >
        <Stack spacing="1rem" p={{ base: '1.5rem', md: '2rem' }}>
          <StepLabel stepNumber={stepNumber} />
          <Stack direction="row" spacing="0.5rem" align="center">
            <Icon as={BiPlus} fontSize="1.25rem" color="secondary.500" />
            <Text textStyle="subhead-3">
              {t('features.adminForm.sidebar.workflow.unsetFirstStep.title')}
            </Text>
          </Stack>
          <Text textStyle="body-2" color="secondary.400">
            {t(
              'features.adminForm.sidebar.workflow.unsetFirstStep.description',
            )}
          </Text>
        </Stack>
      </chakra.button>
    </Box>
  )
}
