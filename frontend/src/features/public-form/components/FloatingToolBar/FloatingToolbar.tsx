import { BiQuestionMark, BiSave } from 'react-icons/bi'
import { Flex, useDisclosure } from '@chakra-ui/react'

import { noPrintCss } from '~utils/noPrintCss'
import IconButton from '~components/IconButton'
import Tooltip from '~components/Tooltip'

import { usePublicFormContext } from '~features/public-form/PublicFormContext'

import { FormIssueFeedbackModal } from './FormIssueFeedbackModal'

export const FloatingToolBar = ({
  isPublicFormPage = false,
  onOpenSaveDraft,
}: {
  isPublicFormPage?: boolean
  onOpenSaveDraft?: () => void
}): JSX.Element | null => {
  const { isOpen, onOpen, onClose } = useDisclosure()

  const { isPreview, formId, submissionData } = usePublicFormContext()
  if (submissionData) return null

  return (
    <Flex
      flexDir="column"
      position="fixed"
      bottom={{ base: '1rem', md: '2.625rem' }}
      right={{ base: '1rem', md: '2.75rem' }}
      sx={noPrintCss}
    >
      {isPublicFormPage ? (
        <Tooltip placement="left" label="Save as draft">
          <IconButton
            variant="outline"
            cursor="pointer"
            borderBottomRadius={0}
            _focus={{
              boxShadow: 0,
            }}
            aria-label="save as draft"
            icon={<BiSave color="primary.500" />}
            onClick={onOpenSaveDraft}
          />
        </Tooltip>
      ) : null}
      <Tooltip placement="left" label="Report an issue">
        <IconButton
          variant="outline"
          cursor="pointer"
          // To implement attached button group vertically
          mt="-1px"
          borderTopRadius={0}
          _focus={{
            boxShadow: 0,
          }}
          aria-label="issue feedback"
          icon={<BiQuestionMark color="primary.500" />}
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
