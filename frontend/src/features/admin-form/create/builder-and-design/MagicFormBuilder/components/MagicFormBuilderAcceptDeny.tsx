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
  return isOpen ? (
    <Portal>
      <BottomHugBox>
        <Flex direction="column" gap="1rem">
          <Text textStyle="h6">Use these fields?</Text>
          <NextAndBackButtonGroup
            handleBack={onDeny}
            handleNext={onAccept}
            nextButtonLabel="Yes, keep them"
            backButtonLabel="No, delete them"
          />
        </Flex>
      </BottomHugBox>
    </Portal>
  ) : null
}

export default MagicFormBuilderAcceptDeny
