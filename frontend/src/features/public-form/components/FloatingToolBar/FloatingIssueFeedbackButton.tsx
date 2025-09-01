import { useDisclosure } from "@chakra-ui/react"
import { BiQuestionMark } from "react-icons/bi"
import IconButton from "~components/IconButton"
import Tooltip from "~components/Tooltip"
import { FormIssueFeedbackModal } from "./FormIssueFeedbackModal"
import { useIsMobile } from "~hooks/useIsMobile"

export const FloatingIssueFeedbackButton = ({
  isPreview,
  formId,
}: {
  isPreview: boolean
  formId: string
}) => {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const isMobile = useIsMobile()
  
  return (
    <>
      <Tooltip placement={isMobile ? 'top' : 'left'} label="Report an issue">
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
    </>
  )
}