import { BiQuestionMark } from 'react-icons/bi'
import { useDisclosure, useToken } from '@chakra-ui/react'

import { FormColorTheme } from '~shared/types'

import { useIsMobile } from '~hooks/useIsMobile'
import IconButton from '~components/IconButton'
import Tooltip from '~components/Tooltip'

import { FormIssueFeedbackModal } from './FormIssueFeedbackModal'

export const FloatingIssueFeedbackButton = ({
  isPreview,
  formId,
  colorTheme = FormColorTheme.Blue,
}: {
  isPreview: boolean
  formId: string
  colorTheme?: FormColorTheme
}) => {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const isMobile = useIsMobile()
  const [iconColor] = useToken('colors', [`theme-${colorTheme}.500`])

  return (
    <>
      <Tooltip placement={isMobile ? 'top' : 'left'} label="Report an issue">
        <IconButton
          variant="outline"
          colorScheme={`theme-${colorTheme}`}
          cursor="pointer"
          // To implement attached button group vertically
          mt="-1px"
          _focus={{
            boxShadow: 0,
          }}
          aria-label="issue feedback"
          icon={<BiQuestionMark color={iconColor} />}
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
