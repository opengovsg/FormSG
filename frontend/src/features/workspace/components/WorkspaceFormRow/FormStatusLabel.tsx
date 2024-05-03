import { useMemo } from 'react'
import { Circle, Flex, Text } from '@chakra-ui/layout'

import { FormStatus } from '~shared/types/form/form'

export interface FormStatusLabelProps {
  status: FormStatus
}

export const FormStatusLabel = ({
  status,
}: FormStatusLabelProps): JSX.Element => {
  const renderMeta = useMemo(() => {
    switch (status) {
      case FormStatus.Private:
        return { label: 'Closed', circleColor: 'interaction.neutral.default' }
      case FormStatus.Public:
        return { label: 'Open', circleColor: 'interaction.success.default' }
      default:
        throw new Error('Should never happen')
    }
  }, [status])

  return (
    <Flex align="center">
      <Circle size="0.5rem" mr="0.5rem" bg={renderMeta.circleColor} />
      <Text textStyle="body-2">{renderMeta.label}</Text>
    </Flex>
  )
}
