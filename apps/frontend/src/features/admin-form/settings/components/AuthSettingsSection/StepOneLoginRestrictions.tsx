import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'
import { Box, Divider, Stack, Text } from '@chakra-ui/react'

import { KB } from 'formsg-shared/constants'
import {
  FormAuthType,
  FormResponseMode,
  FormStatus,
  MultirespondentFormSettings,
} from 'formsg-shared/types'
import { VALID_WHITELIST_FILE_EXTENSIONS } from 'formsg-shared/utils/file-validation'
import { isLoginIdentityField } from 'formsg-shared/utils/login-identity'
import { getStepFields } from 'formsg-shared/utils/step-login'

import { textStyles } from '~theme/textStyles'
import { parseCsvFile } from '~utils/parseCsvFile'
import Attachment from '~components/Field/Attachment'
import InlineMessage from '~components/InlineMessage'
import Link from '~components/Link'
import Toggle from '~components/Toggle'

import { useAdminForm } from '~features/admin-form/common/queries'
import { FieldListTabIndex } from '~features/admin-form/create/builder-and-design/constants'
import { getNextQuestionNumber } from '~features/form/utils'

import {
  updateFormWhitelistSetting,
  updateIsSingleSubmission,
} from '../../SettingsService'

import { SecretKeyDownloadWhitelistFileModal } from './SecretKeyDownloadWhitelistFileModal'
import { SubmitterIdCollectionSection } from './SubmitterIdCollectionSection'

export interface StepOneLoginRestrictionsDraft {
  isSingleSubmission: boolean
  whitelist:
    | { kind: 'unchanged' }
    | { kind: 'remove' }
    | { kind: 'replace'; file: File; csv: string }
}

export const createStepOneLoginRestrictionsDraft = (
  settings: Pick<MultirespondentFormSettings, 'isSingleSubmission'>,
): StepOneLoginRestrictionsDraft => ({
  isSingleSubmission: !!settings.isSingleSubmission,
  whitelist: { kind: 'unchanged' },
})

/** Uses the existing encrypted whitelist endpoint. No requests run while editing. */
export const saveStepOneLoginRestrictions = async (
  formId: string,
  baseline: Pick<MultirespondentFormSettings, 'isSingleSubmission'>,
  draft: StepOneLoginRestrictionsDraft,
  onSingleSubmissionSaved?: (enabled: boolean) => void,
): Promise<void> => {
  if (draft.isSingleSubmission !== !!baseline.isSingleSubmission) {
    await updateIsSingleSubmission(formId, draft.isSingleSubmission)
    onSingleSubmissionSaved?.(draft.isSingleSubmission)
  }
  if (draft.whitelist.kind !== 'unchanged') {
    await updateFormWhitelistSetting(
      formId,
      draft.whitelist.kind === 'remove'
        ? null
        : Promise.resolve(draft.whitelist.csv),
    )
  }
}

interface StepOneLoginRestrictionsProps {
  settings: MultirespondentFormSettings
  value: StepOneLoginRestrictionsDraft
  onChange: (patch: Partial<StepOneLoginRestrictionsDraft>) => void
  isDisabled: boolean
  onParsingChange?: (isParsing: boolean) => void
  dividerBleed?: string
  authType?: FormAuthType
  onGoToFields?: (tab: FieldListTabIndex) => void
}

const COPY_KEY = 'features.adminForm.sidebar.workflow.stepLogin.restrictions'

/** Shared controlled Step 1 restrictions for Create and Settings drafts. */
export const StepOneLoginRestrictions = ({
  settings,
  value,
  onChange,
  isDisabled,
  onParsingChange,
  dividerBleed,
  authType,
  onGoToFields,
}: StepOneLoginRestrictionsProps): JSX.Element => {
  const { t } = useTranslation()
  const { formId } = useParams()
  const { data: form } = useAdminForm()
  const [error, setError] = useState('')
  const [isParsing, setIsParsing] = useState(false)
  const [isDownloadOpen, setIsDownloadOpen] = useState(false)
  const parseRequest = useRef(0)
  const parsingCallback = useRef(onParsingChange)
  parsingCallback.current = onParsingChange
  useEffect(
    () => () => {
      parseRequest.current += 1
      parsingCallback.current?.(false)
    },
    [],
  )

  const savedWhitelist = !!settings.whitelistedSubmitterIds?.isWhitelistEnabled
  const filename = `whitelist_${formId}.csv`
  const file =
    value.whitelist.kind === 'replace'
      ? value.whitelist.file
      : value.whitelist.kind === 'unchanged' && savedWhitelist
        ? ({ name: filename, size: null, type: 'text/csv' } as unknown as File)
        : null

  const selectFile = async (selected: File | null) => {
    if (!selected) return
    const request = ++parseRequest.current
    setIsParsing(true)
    onParsingChange?.(true)
    setError('')
    try {
      const rows = await parseCsvFile(selected, (header) => ({
        isValid:
          !!header &&
          header.length === 1 &&
          header[0].replace(/(\r\n|\n|\r)/gm, '').toLowerCase() ===
            'respondent',
        invalidReason: t(`${COPY_KEY}.invalidCsvHeader`),
      }))
      if (request !== parseRequest.current) return
      onChange({
        whitelist: {
          kind: 'replace',
          file: selected,
          csv: rows
            .map((row) => row[0].trim())
            .filter(Boolean)
            .join(','),
        },
      })
    } catch (cause) {
      if (request === parseRequest.current)
        setError(
          cause instanceof Error
            ? cause.message
            : t(`${COPY_KEY}.unreadableCsv`),
        )
    } finally {
      if (request === parseRequest.current) {
        setIsParsing(false)
        onParsingChange?.(false)
      }
    }
  }

  const stepOneFields = !form
    ? []
    : form.responseMode === FormResponseMode.Multirespondent
      ? getStepFields(form.form_fields, form.workflow, 0)
      : form.form_fields
  const divider = (
    <Divider
      alignSelf="center"
      w={
        dividerBleed
          ? `calc(100% + ${dividerBleed} + ${dividerBleed})`
          : undefined
      }
    />
  )

  return (
    <Stack spacing="2rem" mt="0.75rem">
      {authType ? (
        <SubmitterIdCollectionSection
          settings={settings}
          isFormPublic={settings.status === FormStatus.Public}
          hasIdentityFields={stepOneFields.some(isLoginIdentityField)}
          nextQuestionNumber={getNextQuestionNumber(form?.form_fields ?? [])}
          authType={authType}
          divider={divider}
          onGoToFields={onGoToFields}
        />
      ) : null}
      {divider}
      <Toggle
        isDisabled={isDisabled || isParsing}
        isChecked={value.isSingleSubmission}
        label={t(`${COPY_KEY}.singleSubmission`)}
        labelStyles={{ ...textStyles.h4, color: 'inherit' }}
        onChange={() =>
          onChange({ isSingleSubmission: !value.isSingleSubmission })
        }
      />
      {divider}
      <Box>
        <Text textStyle="h4" mb="0.25rem">
          {t(`${COPY_KEY}.whitelistTitle`)}
        </Text>
        <Text textStyle="body-2" color="secondary.400" mb="1rem">
          {t(`${COPY_KEY}.whitelistDescription`)}{' '}
          <Link
            href="https://go.gov.sg/formsg-whitelist-respondents-sample-csv"
            isExternal
          >
            {t(`${COPY_KEY}.downloadSample`)}
          </Link>
        </Text>
        <Attachment
          name="step-one-whitelist"
          value={file}
          onChange={selectFile}
          onError={setError}
          handleRemoveFileOverride={() => {
            setError('')
            onChange({ whitelist: { kind: 'remove' } })
          }}
          handleDownloadFileOverride={
            value.whitelist.kind === 'unchanged'
              ? () => setIsDownloadOpen(true)
              : undefined
          }
          maxSize={250 * KB}
          accept={VALID_WHITELIST_FILE_EXTENSIONS}
          disabled={isDisabled || isParsing}
          isRemoveDisabled={isDisabled || isParsing}
          showFileSize
          showDownload
          showRemove
        />
        {isParsing ? (
          <Text textStyle="caption-1" role="status">
            {t(`${COPY_KEY}.checkingCsv`)}
          </Text>
        ) : null}
        {error ? (
          <InlineMessage variant="error" mt="1rem">
            {error}
          </InlineMessage>
        ) : null}
      </Box>
      <SecretKeyDownloadWhitelistFileModal
        isOpen={isDownloadOpen}
        onClose={() => setIsDownloadOpen(false)}
        publicKey={settings.publicKey}
        formId={formId!}
        downloadFileName={filename}
      />
    </Stack>
  )
}
