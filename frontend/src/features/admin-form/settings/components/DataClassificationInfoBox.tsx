import { useTranslation } from 'react-i18next'
import { BiSolidInfoCircle } from 'react-icons/bi'
import { Flex, Icon } from '@chakra-ui/react'

import { useMdComponents } from '~hooks/useMdComponents'
import { MarkdownText } from '~components/MarkdownText'

export default function DataClassificationInfoBox() {
  const { t } = useTranslation('translation', {
    keyPrefix: 'features.adminForm.settings.general',
  })
  const mdComponents = useMdComponents({})

  return (
    <Flex bg="primary.100" p="1rem" marginBottom="40px" borderRadius="4px">
      <Icon
        as={BiSolidInfoCircle}
        color="primary.500"
        fontSize="1.5rem"
        mr="0.5rem"
      />
      <MarkdownText components={mdComponents}>
        {t('dataClassificationInfo')}
      </MarkdownText>
    </Flex>
  )
}
