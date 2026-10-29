import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Box, Divider, Stack, Text } from '@chakra-ui/react'

import { KB } from 'formsg-shared/constants'
import { MultirespondentFormSettings } from 'formsg-shared/types'
import { VALID_WHITELIST_FILE_EXTENSIONS } from 'formsg-shared/utils/file-validation'

import { parseCsvFile } from '~utils/parseCsvFile'
import Attachment from '~components/Field/Attachment'
import InlineMessage from '~components/InlineMessage'
import Link from '~components/Link'
import Toggle from '~components/Toggle'

import {
  updateFormWhitelistSetting,
  updateIsSingleSubmission,
} from '../../SettingsService'

import { SecretKeyDownloadWhitelistFileModal } from './SecretKeyDownloadWhitelistFileModal'

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
): Promise<void> => {
  if (draft.isSingleSubmission !== !!baseline.isSingleSubmission) {
    await updateIsSingleSubmission(formId, draft.isSingleSubmission)
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
}

/** Shared controlled Step 1 restrictions for Create and Settings drafts. */
export const StepOneLoginRestrictions = ({
  settings,
  value,
  onChange,
  isDisabled,
  onParsingChange,
}: StepOneLoginRestrictionsProps): JSX.Element => {
  const { formId } = useParams()
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
        invalidReason:
          'Your CSV file should only contain a single column with the header "Respondent".',
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
            : 'Unable to read the CSV file.',
        )
    } finally {
      if (request === parseRequest.current) {
        setIsParsing(false)
        onParsingChange?.(false)
      }
    }
  }

  return (
    <Stack spacing="2rem" mt="2rem">
      <Divider />
      <Toggle
        isDisabled={isDisabled || isParsing}
        isChecked={value.isSingleSubmission}
        label="Limit each unique NRIC/FIN/UEN to one response"
        onChange={() =>
          onChange({ isSingleSubmission: !value.isSingleSubmission })
        }
      />
      <Divider />
      <Box>
        <Text textStyle="subhead-1" mb="0.25rem">
          Restrict form to eligible NRIC/FIN/UENs only
        </Text>
        <Text textStyle="body-2" color="secondary.400" mb="1rem">
          Only NRIC/FIN/UENs in this list can submit a response. Upload a
          single-column CSV with the “Respondent” header.{' '}
          <Link
            href="https://go.gov.sg/formsg-whitelist-respondents-sample-csv"
            isExternal
          >
            Download a sample .csv file
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
            Checking CSV…
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
