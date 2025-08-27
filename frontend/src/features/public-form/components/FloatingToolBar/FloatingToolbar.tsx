import { BiQuestionMark, BiSave } from 'react-icons/bi'
import { Stack, useDisclosure } from '@chakra-ui/react'
import { useToast } from '~hooks/useToast'
import { format } from 'date-fns'

import { noPrintCss } from '~utils/noPrintCss'
import IconButton from '~components/IconButton'
import Tooltip from '~components/Tooltip'

import { usePublicFormContext } from '~features/public-form/PublicFormContext'

import { FormIssueFeedbackModal } from './FormIssueFeedbackModal'
import { useFormContext } from 'react-hook-form'
import { getUpdatedSaveDraftResponses } from '~features/public-form/utils/getUpdatedSaveDraftValues'

const SaveDraftButton = ({ onSaveDraft, draftLastUpdated }: { onSaveDraft?: () => void, draftLastUpdated?: number | null }) => {

  const toast = useToast({ isClosable: true })
  const defaultOnSaveDraft = () => {
    toast({
      description: 'Since you are in preview mode, there is no draft saved.',
    })
  }

  const tooltipLabel = draftLastUpdated ? `Last saved: ${format(new Date(draftLastUpdated), 'do MMM yyyy, h:mm:ss a')}` : 'Save a draft'

  return (
    <Tooltip placement="left" label={tooltipLabel}>
          <IconButton
            variant="outline"
            cursor="pointer"
            borderBottomRadius={0}
            _focus={{
              boxShadow: 0,
            }}
            aria-label="save a draft"
            icon={<BiSave color="primary.500" />}
            onClick={onSaveDraft || defaultOnSaveDraft}
          />
        </Tooltip>
  )
}

const IssueFeedbackButton = ({ isPreview, formId }: { isPreview: boolean, formId: string }) => {
  const { isOpen, onOpen, onClose } = useDisclosure()
  return <>
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
    </>
}

export const FloatingToolBar = (): JSX.Element | null => {
  const { isPreview, formId, submissionData } = usePublicFormContext()
  if (submissionData) return null

  const { draftSubmission, setDraftSubmission } = usePublicFormContext()
  const { formState: { dirtyFields }, getValues } = useFormContext()
  const toast = useToast({ isClosable: true })

  const onSaveDraft = () => {
    const updatedDraftResponses = getUpdatedSaveDraftResponses({
      formFieldValues: getValues(),
      dirtyFields,
      previousDraftResponses: draftSubmission?.draftResponses,
    })
    
    setDraftSubmission({
      lastUpdated: Date.now(),
      draftResponses: updatedDraftResponses
    })
    
    toast({ 
      description: 'Your draft has been successfully saved.',
    })
  }

  return (
    <Stack
      direction={{ base: 'row', md: 'column' }}
      position="fixed"
      spacing='1rem'
      bottom='2rem'
      right='2rem'
      sx={noPrintCss}
      zIndex="docked"
    >
      <IssueFeedbackButton isPreview={isPreview} formId={formId} />
      <SaveDraftButton onSaveDraft={onSaveDraft} draftLastUpdated={draftSubmission?.lastUpdated} />
    </Stack>
  )
}
