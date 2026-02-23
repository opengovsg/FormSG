import { BiQuestionMark } from 'react-icons/bi'
import { useDisclosure } from '@chakra-ui/react'

import { useIsMobile } from '~hooks/useIsMobile'
import IconButton from '~components/IconButton'
import Tooltip from '~components/Tooltip'

import { useFormColorScheme } from '~features/public-form/utils/useFormColorScheme'

import { FormIssueFeedbackModal } from './FormIssueFeedbackModal'

export const FloatingIssueFeedbackButton = ({
  isPreview,
  formId,
}: {
  isPreview: boolean
  formId: string
}) => {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const isMobile = useIsMobile()
  const colorScheme = useFormColorScheme()
  return (
    <>
      <Tooltip placement={isMobile ? 'top' : 'left'} label="Report an issue">
        <IconButton
          variant="outline"
          colorScheme={colorScheme}
          cursor="pointer"
          // To implement attached button group vertically
          mt="-1px"
          _focus={{
            boxShadow: 0,
          }}
          aria-label="issue feedback"
          icon={<BiQuestionMark />}
          onClick={onOpen}
        />
      </Tooltip>
      <FormIssueFeedbackModal
        isOpen={isOpen}
        onClose={onClose}
        isPreview={isPreview}
        formId={formId}
      />
    </>
  )
}
