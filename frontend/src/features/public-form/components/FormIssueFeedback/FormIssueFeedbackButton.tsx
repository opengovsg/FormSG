import { BiMessage } from 'react-icons/bi'
import { Flex, useDisclosure } from '@chakra-ui/react'

import { noPrintCss } from '~utils/noPrintCss'
import IconButton from '~components/IconButton'
import Tooltip from '~components/Tooltip'

import { usePublicFormContext } from '~features/public-form/PublicFormContext'

import { FormIssueFeedbackModal } from './FormIssueFeedbackModal'

export const FormIssueFeedbackButton = (): JSX.Element => {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const { isPreview, formId } = usePublicFormContext()

  return (
    <Flex position="fixed" bottom="2.625rem" right="2.75rem" sx={noPrintCss}>
      <Tooltip placement="left" label="Report an issue">
        <IconButton
          variant="outline"
          cursor="pointer"
          aria-label="issue feedback"
          icon={<BiMessage color="primary.500" />}
          onClick={onOpen}
        />
      </Tooltip>
      <FormIssueFeedbackModal
        isOpen={isOpen}
        onClose={onClose}
        isPreview={isPreview}
        formId={formId}
      />
    </Flex>
  )
}
