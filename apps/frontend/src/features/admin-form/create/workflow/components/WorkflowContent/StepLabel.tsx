import { useTranslation } from 'react-i18next'

import { Flex, Stack, Text } from '@chakra-ui/react'

import { useWorkflowSurfaces } from '../../hooks/useWorkflowSurfaces'
import { getWorkflowStepLabel } from '../../utils/getWorkflowStepLabel'

type StepLabelProps = {
  stepNumber: number
  stepName?: string | undefined
}

export const StepLabel = ({ stepNumber, stepName }: StepLabelProps) => {
  const { t } = useTranslation()
  const { cardRadius, stepLabelTextStyle } = useWorkflowSurfaces()
  const stepLabel = getWorkflowStepLabel({
    stepNumber,
    stepName,
    stepWord: t('features.common.entities.step'),
  })
  return (
    <Stack
      direction="row"
      spacing="1.5rem"
      alignItems="center"
      textStyle={stepLabelTextStyle}
    >
      <Text
        py="0.5rem"
        px="1rem"
        borderWidth="1px"
        borderColor="secondary.300"
        borderRadius={cardRadius}
      >
        {stepNumber + 1}
      </Text>
      <Flex direction="row">
        <Text>{stepLabel}</Text>
      </Flex>
    </Stack>
  )
}
