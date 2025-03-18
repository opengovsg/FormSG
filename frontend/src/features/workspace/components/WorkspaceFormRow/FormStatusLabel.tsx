import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Circle, Flex, Text } from '@chakra-ui/layout'

import { FormStatus } from '~shared/types/form/form'

export interface FormStatusLabelProps {
  status: FormStatus
}

export const FormStatusLabel = ({
  status,
}: FormStatusLabelProps): JSX.Element => {
  const { t } = useTranslation()
  const { closed, open } = t('features.common.formStatus', {
    returnObjects: true,
  })
  const renderMeta = useMemo(() => {
    switch (status) {
      case FormStatus.Private:
        return { label: closed, circleColor: 'neutral.500' }
      case FormStatus.Public:
        return { label: open, circleColor: 'success.500' }
      default:
        throw new Error('Should never happen')
    }
  }, [status, closed, open])

  return (
    <Flex align="center">
      <Circle size="0.5rem" mr="0.5rem" bg={renderMeta.circleColor} />
      <Text textStyle="body-2">{renderMeta.label}</Text>
    </Flex>
  )
}
