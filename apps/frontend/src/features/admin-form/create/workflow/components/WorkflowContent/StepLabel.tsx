import { useTranslation } from 'react-i18next'
import { Flex, Stack, Text } from '@chakra-ui/react'

type StepLabelProps = {
  stepNumber: number
  stepName?: string | undefined
}

export const StepLabel = ({ stepNumber, stepName }: StepLabelProps) => {
  const { t } = useTranslation()
  const stepLabel =
    stepName ?? `${t('features.common.entities.step')} ${stepNumber + 1}`
  return (
    <Stack
      direction="row"
      spacing="1.5rem"
      alignItems="center"
      textStyle="subhead-3"
    >
      <Text
        py="0.5rem"
        px="1rem"
        borderWidth="1px"
        borderColor="secondary.300"
        borderRadius="4px"
      >
        {stepNumber + 1}
      </Text>
      <Flex direction="row">
        <Text>{stepLabel}</Text>
      </Flex>
    </Stack>
  )
}
