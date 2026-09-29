import { useState } from 'react'
import { useParams } from 'react-router'

import {
  MultirespondentFormSettings,
  StorageFormSettings,
} from 'formsg-shared/types'

import { useMutateFormSettings } from '../../mutations'

import { SecretKeyDownloadWhitelistFileModal } from './SecretKeyDownloadWhitelistFileModal'
import { WhitelistAttachmentField } from './WhitelistAttachmentField'

interface FormWhitelistAttachmentFieldProps {
  settings: StorageFormSettings | MultirespondentFormSettings
  isDisabled: boolean
}

const FormWhitelistAttachmentFieldName = 'whitelist-csv-attachment-field'

export const FormWhitelistAttachmentField = ({
  settings,
  isDisabled,
}: FormWhitelistAttachmentFieldProps): JSX.Element => {
  const { mutateFormWhitelistSetting } = useMutateFormSettings()
  const { formId } = useParams()
  const [isSecretKeyModalOpen, setIsSecretKeyModalOpen] = useState(false)

  const standardCsvDownloadFileName = `whitelist_${formId}.csv`
  const { publicKey, whitelistedSubmitterIds } = settings

  return (
    <>
      <SecretKeyDownloadWhitelistFileModal
        isOpen={isSecretKeyModalOpen}
        onClose={() => setIsSecretKeyModalOpen(false)}
        publicKey={publicKey}
        formId={formId!}
        downloadFileName={standardCsvDownloadFileName}
      />
      <WhitelistAttachmentField
        fieldId={FormWhitelistAttachmentFieldName}
        title="Restrict form to eligible NRIC/FIN/UENs only"
        description={
          'Only NRIC/FIN/UENs in this list are allowed to submit a response. CSV file should include all whitelisted NRIC/FIN/UENs in a single column with the "Respondent" header. ' +
          '[Download a sample .csv file](https://go.gov.sg/formsg-whitelist-respondents-sample-csv)'
        }
        isWhitelistEnabled={!!whitelistedSubmitterIds?.isWhitelistEnabled}
        downloadFileName={standardCsvDownloadFileName}
        isDisabled={isDisabled}
        isSaving={mutateFormWhitelistSetting.isLoading}
        onSave={mutateFormWhitelistSetting.mutateAsync}
        onDownload={() => setIsSecretKeyModalOpen(true)}
      />
    </>
  )
}
