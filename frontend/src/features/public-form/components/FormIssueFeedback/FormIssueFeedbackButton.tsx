import { BiQuestionMark } from 'react-icons/bi'
import { Flex, useDisclosure } from '@chakra-ui/react'
import { IconButton, TouchableTooltip } from '@opengovsg/design-system-react'

import { noPrintCss } from '~utils/noPrintCss'

import { usePublicFormContext } from '~features/public-form/PublicFormContext'

import { FormIssueFeedbackModal } from './FormIssueFeedbackModal'

export const FormIssueFeedbackButton = (): JSX.Element | null => {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const { isPreview, formId, submissionData } = usePublicFormContext()
  if (submissionData) return null

  return (
    <Flex
      position="fixed"
      bottom={{ base: '1rem', md: '2.625rem' }}
      right={{ base: '1rem', md: '2.75rem' }}
      sx={noPrintCss}
    >
      <TouchableTooltip placement="left" label="Report an issue">
        <IconButton
          variant="outline"
          cursor="pointer"
          aria-label="issue feedback"
          icon={<BiQuestionMark />}
          onClick={onOpen}
        />
      </TouchableTooltip>
      <FormIssueFeedbackModal
        isOpen={isOpen}
        onClose={onClose}
        isPreview={isPreview}
        formId={formId}
      />
    </Flex>
  )
}
