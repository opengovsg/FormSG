import { BiQuestionMark, BiSave } from 'react-icons/bi'
import { Stack, useDisclosure } from '@chakra-ui/react'

import { noPrintCss } from '~utils/noPrintCss'
import IconButton from '~components/IconButton'
import Tooltip from '~components/Tooltip'

import { usePublicFormContext } from '~features/public-form/PublicFormContext'

import { FormIssueFeedbackModal } from './FormIssueFeedbackModal'
import { useTranslation } from 'react-i18next'

const SaveDraftButton = ({ onSaveDraft, draftLastSavedDateTimeString }: { onSaveDraft: () => void, draftLastSavedDateTimeString?: string }) => {

  const { t } = useTranslation()

  const tooltipLabel = draftLastSavedDateTimeString ? t('features.publicForm.components.saveDraft.tooltip.lastSaved', { lastSavedDateTimeString: draftLastSavedDateTimeString }) : t('features.publicForm.components.saveDraft.tooltip.default')

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
            onClick={onSaveDraft}
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

  const { draftLastSavedDateTimeString, onSaveDraft, isSaveDraftEnabled } = usePublicFormContext()

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
      {isSaveDraftEnabled && <SaveDraftButton onSaveDraft={onSaveDraft} draftLastSavedDateTimeString={draftLastSavedDateTimeString} />}
    </Stack>
  )
}
