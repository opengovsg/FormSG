import { memo, useCallback, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { BiDownload } from 'react-icons/bi'
import { Stack, Table, Tbody, Td, Text, Tr } from '@chakra-ui/react'
import { useFeatureIsOn } from '@growthbook/growthbook-react'
import { FieldType } from '@opengovsg/formsg-sdk/dist/types'
import JSZip from 'jszip'

import { featureFlags } from 'formsg-shared/constants'
import { BasicField } from 'formsg-shared/types'
import { handleAddressResponseDisplay } from 'formsg-shared/utils/address'

import Button from '~components/Button'
import FormLabel from '~components/FormControl/FormLabel'
import Spinner from '~components/Spinner'

import { getVerifiedQuestionLabel } from '../common/utils/questionLabel'
import { getAttachmentQuestionLabel } from '../ResponsesPage/storage/utils/attachmentQuestionLabel'
import { AugmentedDecryptedResponse } from '../ResponsesPage/storage/utils/augmentDecryptedResponses'

import {
  downloadAndDecryptOrThrow,
  useMutateDownloadAttachments,
} from './mutations'
import { SignatureCanvas } from './SignatureCanvas'

export interface DecryptedRowBaseProps {
  row: AugmentedDecryptedResponse
}
type DecryptedRowProps = DecryptedRowBaseProps & {
  attachmentDecryptionKey: string
}

function DecryptedQuestionLabel({ row }: DecryptedRowBaseProps) {
  const { t } = useTranslation()
  const keepV4AttachmentPrefix = useFeatureIsOn(
    featureFlags.keepV4AttachmentPrefix,
  )
  return (
    <FormLabel questionNumber={`${row.questionNumber}.`} isRequired>
      {getVerifiedQuestionLabel(
        getAttachmentQuestionLabel({
          question: row.question,
          fieldType: row.fieldType,
          keepV4AttachmentPrefix,
        }),
        !!row.signature,
        t('features.common.verified'),
      )}
    </FormLabel>
  )
}

const DecryptedHeaderRow = ({ row }: DecryptedRowBaseProps): JSX.Element => {
  return (
    <Text
      textStyle="h2"
      as="h2"
      color="primary.500"
      mb="0.5rem"
      _notFirst={{ mt: '2.5rem' }}
    >
      {row.question}
    </Text>
  )
}

const DecryptedTableRow = ({ row }: DecryptedRowBaseProps): JSX.Element => {
  return (
    <Stack>
      <DecryptedQuestionLabel row={row} />
      <Table variant="column-stripe" sx={{ tableLayout: 'fixed' }}>
        <Tbody>
          {row.answerArray?.map((row, idx) => (
            <Tr key={idx}>
              {Array.isArray(row) ? (
                row.map((col, cidx) => <Td key={cidx}>{col}</Td>)
              ) : (
                <Td>{row}</Td>
              )}
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Stack>
  )
}

const AttachmentDownloadLink = ({
  fileName,
  isLoading,
  isDisabled,
  onClick,
}: {
  fileName: string
  isLoading: boolean
  isDisabled: boolean
  onClick: () => void
}) => {
  const { t } = useTranslation()
  return (
    <Button
      variant="link"
      aria-label={t(
        'features.adminForm.responses.individualResponse.decryptedAttachment.aria',
        { fileName },
      )}
      isDisabled={isDisabled}
      onClick={onClick}
      rightIcon={
        isLoading ? (
          <Spinner fontSize="1.5rem" />
        ) : (
          <BiDownload fontSize="1.5rem" />
        )
      }
    >
      {fileName}
    </Button>
  )
}

const DecryptedAttachmentRow = ({
  row,
  attachmentDecryptionKey,
}: DecryptedRowProps) => {
  const { t } = useTranslation()
  const keepV4AttachmentPrefix = useFeatureIsOn(
    featureFlags.keepV4AttachmentPrefix,
  )

  const { downloadAttachmentMutation } = useMutateDownloadAttachments()

  const handleDownload = useCallback(() => {
    if (!row.downloadUrl || !row.answer) return
    return downloadAttachmentMutation.mutate({
      url: row.downloadUrl,
      secretKey: attachmentDecryptionKey,
      fileName: row.answer,
    })
  }, [downloadAttachmentMutation, row, attachmentDecryptionKey])

  return (
    <Stack>
      <DecryptedQuestionLabel row={row} />
      <Text textStyle="body-1">
        {keepV4AttachmentPrefix ? `${t('features.common.filename')}: ` : null}
        {row.answer && (
          <AttachmentDownloadLink
            fileName={row.answer}
            isLoading={downloadAttachmentMutation.isLoading}
            isDisabled={downloadAttachmentMutation.isLoading}
            onClick={handleDownload}
          />
        )}
      </Text>
    </Stack>
  )
}

/**
 * A multi-file answer, one link per file. The answer's zip is downloaded,
 * decrypted and opened on the first click, and kept for the other files.
 */
const DecryptedMultiAttachmentRow = ({
  row,
  attachmentDecryptionKey,
}: DecryptedRowProps) => {
  const { downloadMultiAttachmentFileMutation: mutation } =
    useMutateDownloadAttachments()
  const zipRef = useRef<{ url?: string; key: string; zip: Promise<JSZip> }>()

  const getZip = useCallback(() => {
    const url = row.downloadUrl
    const key = attachmentDecryptionKey
    const cached = zipRef.current
    if (cached && cached.url === url && cached.key === key) return cached.zip
    const next = {
      url,
      key,
      zip: downloadAndDecryptOrThrow(url, key).then((zip) =>
        JSZip.loadAsync(zip),
      ),
    }
    zipRef.current = next
    // A failed download is tried again on the next click
    next.zip.catch(() => {
      if (zipRef.current === next) zipRef.current = undefined
    })
    return next.zip
  }, [row.downloadUrl, attachmentDecryptionKey])

  return (
    <Stack>
      <DecryptedQuestionLabel row={row} />
      <Stack spacing="0.25rem" align="flex-start">
        {(row.answerArray ?? []).flat().map((fileName) => (
          <AttachmentDownloadLink
            key={fileName}
            fileName={fileName}
            isLoading={
              mutation.isLoading && mutation.variables?.fileName === fileName
            }
            isDisabled={mutation.isLoading}
            onClick={() => mutation.mutate({ getZip, fileName })}
          />
        ))}
      </Stack>
    </Stack>
  )
}

const DecryptedAddressRow = ({ row }: DecryptedRowBaseProps): JSX.Element => {
  const transformedAddress = handleAddressResponseDisplay(
    row.answerArray as string[],
  ).join(', ')
  return (
    <Stack>
      <DecryptedQuestionLabel row={row} />
      <Text textStyle="body-1">{transformedAddress}</Text>
    </Stack>
  )
}

const DecryptedSignatureRow = ({ row }: DecryptedRowBaseProps): JSX.Element => {
  return (
    <Stack>
      <DecryptedQuestionLabel row={row} />
      <SignatureCanvas row={row} />
    </Stack>
  )
}

export const DecryptedRow = memo(
  ({ row, attachmentDecryptionKey }: DecryptedRowProps): JSX.Element => {
    switch (row.fieldType as FieldType) {
      case BasicField.Section:
        return <DecryptedHeaderRow row={row} />
      case BasicField.Attachment:
        return row.answerArray ? (
          <DecryptedMultiAttachmentRow
            row={row}
            attachmentDecryptionKey={attachmentDecryptionKey}
          />
        ) : (
          <DecryptedAttachmentRow
            row={row}
            attachmentDecryptionKey={attachmentDecryptionKey}
          />
        )
      case BasicField.Table:
        return <DecryptedTableRow row={row} />
      case BasicField.Address:
        return <DecryptedAddressRow row={row} />
      case BasicField.Signature:
        return <DecryptedSignatureRow row={row} />
      default:
        return (
          <Stack>
            <DecryptedQuestionLabel row={row} />
            {row.answer && <Text textStyle="body-1">{row.answer}</Text>}
            {row.answerArray && (
              <Text textStyle="body-1">{row.answerArray.join(', ')}</Text>
            )}
          </Stack>
        )
    }
  },
)
