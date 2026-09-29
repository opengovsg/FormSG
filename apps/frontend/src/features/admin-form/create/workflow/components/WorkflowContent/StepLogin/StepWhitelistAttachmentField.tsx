import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'
import { Stack, Text } from '@chakra-ui/react'

import { downloadFile } from '~components/Field/Attachment/utils/downloadFile'

import { useAdminForm } from '~features/admin-form/common/queries'
import { SecretKeyDownloadWhitelistFileModal } from '~features/admin-form/settings/components/AuthSettingsSection/SecretKeyDownloadWhitelistFileModal'
import { WhitelistAttachmentField } from '~features/admin-form/settings/components/AuthSettingsSection/WhitelistAttachmentField'

const COPY_KEY = 'features.adminForm.sidebar.workflow.stepLogin.whitelist'

interface StepWhitelistAttachmentFieldProps {
  // 0-based; step 1's list is the form-level one.
  stepNumber: number
  isCorppass: boolean
  // A saved list exists and still applies to the edited provider.
  savedListApplies: boolean
  // Undefined keeps the saved list, null removes it, a string replaces it.
  stagedWhitelist: string | null | undefined
  onStage: (whitelistCsvString: string | null | undefined) => void
  isDisabled: boolean
}

/** A step's eligible-respondent list, staged until the step is saved. */
export const StepWhitelistAttachmentField = ({
  stepNumber,
  isCorppass,
  savedListApplies,
  stagedWhitelist,
  onStage,
  isDisabled,
}: StepWhitelistAttachmentFieldProps): JSX.Element | null => {
  const { t } = useTranslation()
  const { formId } = useParams()
  const { data: form } = useAdminForm()
  const [isSecretKeyModalOpen, setIsSecretKeyModalOpen] = useState(false)

  if (!formId || !form || !('publicKey' in form)) return null

  const isFirstStep = stepNumber === 0
  const downloadFileName = isFirstStep
    ? `whitelist_${formId}.csv`
    : `whitelist_${formId}_step_${stepNumber + 1}.csv`

  const handleStage = (whitelistCsvString: Promise<string> | null) => {
    if (!whitelistCsvString) {
      // Removing a list that was never saved just drops the staged one.
      onStage(savedListApplies ? null : undefined)
      return Promise.resolve()
    }
    return whitelistCsvString.then((csv) =>
      csv ? onStage(csv) : Promise.reject(new Error(t(`${COPY_KEY}.empty`))),
    )
  }

  const handleDownload = () => {
    if (!stagedWhitelist) return setIsSecretKeyModalOpen(true)
    // An unsaved list is downloaded as staged, since the server doesn't have it yet.
    downloadFile(
      new File(
        [['Respondent', ...stagedWhitelist.split(',')].join('\n')],
        downloadFileName,
        { type: 'text/csv' },
      ),
    )
  }

  return (
    <Stack spacing="0.5rem">
      <SecretKeyDownloadWhitelistFileModal
        isOpen={isSecretKeyModalOpen}
        onClose={() => setIsSecretKeyModalOpen(false)}
        publicKey={form.publicKey}
        formId={formId}
        downloadFileName={downloadFileName}
        stepNumber={isFirstStep ? undefined : stepNumber}
      />
      <WhitelistAttachmentField
        fieldId={`step-${stepNumber}-whitelist-csv-attachment-field`}
        title={t(`${COPY_KEY}.${isCorppass ? 'uenTitle' : 'nricTitle'}`, {
          stepNumber: stepNumber + 1,
        })}
        description={t(
          `${COPY_KEY}.${isCorppass ? 'uenDescription' : 'nricDescription'}`,
        )}
        isWhitelistEnabled={
          stagedWhitelist === undefined
            ? savedListApplies
            : stagedWhitelist !== null
        }
        downloadFileName={downloadFileName}
        isDisabled={isDisabled}
        isSaving={false}
        onSave={handleStage}
        onDownload={handleDownload}
      />
      {typeof stagedWhitelist === 'string' ? (
        <Text textStyle="body-2" color="secondary.400">
          {t(`${COPY_KEY}.savesWithStep`)}
        </Text>
      ) : null}
      {stagedWhitelist === null ? (
        <Text textStyle="body-2" color="secondary.400">
          {t(`${COPY_KEY}.removedWithStep`)}
        </Text>
      ) : null}
    </Stack>
  )
}
