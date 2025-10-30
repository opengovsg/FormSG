import { useTranslation } from 'react-i18next'
import { Flex, Portal, Text } from '@chakra-ui/react'

import { NextAndBackButtonGroup } from '~components/Button'
import BottomHugBox from '~components/Hug/BottomHugBox'

const MagicFormBuilderAcceptDeny = ({
  isOpen,
  onAccept,
  onDeny,
}: {
  isOpen: boolean
  onAccept: () => void
  onDeny: () => void
}) => {
  const { t } = useTranslation('translation', {
    keyPrefix: 'features.adminForm.magicFormBuilder.acceptDeny',
  })

  return isOpen ? (
    <Portal>
      <BottomHugBox>
        <Flex direction="column" gap="1rem">
          <Text textStyle="h6" whiteSpace="pre-line">
            {t('message')}
          </Text>
          <NextAndBackButtonGroup
            handleBack={onDeny}
            handleNext={onAccept}
            nextButtonLabel={t('keepButton')}
            backButtonLabel={t('deleteButton')}
          />
        </Flex>
      </BottomHugBox>
    </Portal>
  ) : null
}

export default MagicFormBuilderAcceptDeny
