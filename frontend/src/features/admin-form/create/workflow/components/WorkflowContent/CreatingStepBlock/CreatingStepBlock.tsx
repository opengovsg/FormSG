import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Box, Stack, Text } from '@chakra-ui/react'

import { FieldLogicBadge } from '~features/admin-form/create/logic/components/LogicContent/InactiveLogicBlock/FieldLogicBadge'

import { StepLabel } from '../StepLabel'
import { isFirstStepByStepNumber } from '../utils/isFirstStepByStepNumber'

interface CreatingStepBlockProps {
  stepNumber: number
}

export const CreatingStepBlock = ({
  stepNumber,
}: CreatingStepBlockProps): JSX.Element => {
  const { t } = useTranslation()
  const wrapperRef = useRef<HTMLDivElement | null>(null)

  const isFirstStep = isFirstStepByStepNumber(stepNumber)

  // Auto-scroll into view when component mounts
  useEffect(() => {
    if (wrapperRef.current) {
      wrapperRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      })
    }
  }, [])

  return (
    <Box pos="relative" ref={wrapperRef}>
      <Box
        border="2px solid"
        borderColor="primary.500"
        bg="white"
        borderRadius="4px"
        p={{ base: '1.5rem', md: '2rem' }}
      >
        <Stack spacing="1.5rem">
          {/* Step Label */}
          <StepLabel stepNumber={stepNumber} stepName={undefined} />

          {/* Respondent Section */}
          <Stack>
            <Text textStyle="subhead-3">
              {t(
                'features.adminForm.sidebar.workflow.respondentBlock.stepRespondent',
              )}
            </Text>
            {isFirstStep ? (
              <Text>
                {t(
                  'features.adminForm.sidebar.workflow.respondentBlock.anyone',
                )}
              </Text>
            ) : (
              <FieldLogicBadge
                defaults={{ variant: 'info', message: 'Unselected' }}
              />
            )}
          </Stack>

          {/* Fields Section */}
          <Stack>
            <Text textStyle="subhead-3">
              {t(
                'features.adminForm.sidebar.workflow.respondentBlock.fieldsToFill',
              )}
            </Text>
            <FieldLogicBadge
              defaults={{ variant: 'info', message: 'Unselected' }}
            />
          </Stack>

          {/* Approvals Section (if not first step) */}
          {!isFirstStep && (
            <Stack>
              <Text textStyle="subhead-3">
                {t('features.adminForm.sidebar.workflow.approvals.title')}
              </Text>
              <FieldLogicBadge
                defaults={{
                  variant: 'info',
                  message: t(
                    'features.adminForm.sidebar.workflow.approvals.notRequired',
                  ),
                }}
              />
            </Stack>
          )}
        </Stack>
      </Box>
    </Box>
  )
}
