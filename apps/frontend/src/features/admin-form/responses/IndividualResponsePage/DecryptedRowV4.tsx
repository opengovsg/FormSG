import { memo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { BiDownload } from 'react-icons/bi'
import { Stack, Table, Tbody, Td, Text, Tr } from '@chakra-ui/react'
import {
  AddressAnswerV4,
  AttachmentAnswerV4,
  CheckboxAnswerV4,
  FieldResponseV4,
  RadioAnswerV4,
  SignatureAnswerV4,
  StringAnswerV4,
  TableAnswerV4,
  VerifiableAnswerV4,
} from '@opengovsg/formsg-sdk'

import { CLIENT_CHECKBOX_OTHERS_INPUT_VALUE } from 'formsg-shared/constants'
import { BasicField } from 'formsg-shared/types'
import { handleAddressResponseDisplay } from 'formsg-shared/utils/address'

import Button from '~components/Button'
import FormLabel from '~components/FormControl/FormLabel'
import Spinner from '~components/Spinner'

import { AugmentedDecryptedResponseV4 } from '../ResponsesPage/storage/utils/augmentDecryptedResponses'

import { useMutateDownloadAttachments } from './mutations'
import { RenderedSignatureCanvas } from './SignatureCanvas'

export interface DecryptedRowV4Props extends AugmentedDecryptedResponseV4 {
  attachmentDecryptionKey: string
}

function DecryptedQuestionLabelV4({
  field,
  questionNumber,
}: {
  field: FieldResponseV4
  questionNumber?: number
}) {
  const { t } = useTranslation()
  const isVerified =
    (field.fieldType === 'email' || field.fieldType === 'mobile') &&
    !!(field.answer as VerifiableAnswerV4).signature

  return (
    <FormLabel
      questionNumber={questionNumber ? `${questionNumber}.` : undefined}
      isRequired
    >
      {`${isVerified ? `[${t('features.common.verified')}] ` : ''}${field.question}`}
    </FormLabel>
  )
}

const DecryptedHeaderRowV4 = ({
  field,
}: {
  field: FieldResponseV4
}): JSX.Element => {
  return (
    <Text
      textStyle="h2"
      as="h2"
      color="primary.500"
      mb="0.5rem"
      _notFirst={{ mt: '2.5rem' }}
    >
      {field.question}
    </Text>
  )
}

const DecryptedTableRowV4 = ({
  field,
  questionNumber,
}: {
  field: FieldResponseV4
  questionNumber?: number
}): JSX.Element => {
  const tableAnswer = field.answer as TableAnswerV4
  const rows = Object.values(tableAnswer).sort((a, b) => a.rowNum - b.rowNum)

  return (
    <Stack>
      <DecryptedQuestionLabelV4 field={field} questionNumber={questionNumber} />
      <Table variant="column-stripe" sx={{ tableLayout: 'fixed' }}>
        <Tbody>
          {rows.map((row, idx) => (
            <Tr key={idx}>
              {Object.values(row.value).map((col, cidx) => (
                <Td key={cidx}>{String(col)}</Td>
              ))}
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Stack>
  )
}

const DecryptedAttachmentRowV4 = ({
  field,
  questionNumber,
  downloadUrl,
  attachmentDecryptionKey,
}: {
  field: FieldResponseV4
  questionNumber?: number
  downloadUrl?: string
  attachmentDecryptionKey: string
}) => {
  const { t } = useTranslation()
  const { downloadAttachmentMutation } = useMutateDownloadAttachments()
  const answer = field.answer as AttachmentAnswerV4

  const handleDownload = useCallback(() => {
    if (!downloadUrl || !answer.value) return
    return downloadAttachmentMutation.mutate({
      url: downloadUrl,
      secretKey: attachmentDecryptionKey,
      fileName: answer.value,
    })
  }, [
    downloadAttachmentMutation,
    downloadUrl,
    answer.value,
    attachmentDecryptionKey,
  ])

  return (
    <Stack>
      <DecryptedQuestionLabelV4 field={field} questionNumber={questionNumber} />
      <Text textStyle="body-1">
        {t('features.common.filename')}:{' '}
        {answer.value && (
          <Button
            variant="link"
            aria-label={t(
              'features.adminForm.responses.individualResponse.decryptedAttachment.aria',
            )}
            isDisabled={downloadAttachmentMutation.isLoading}
            onClick={handleDownload}
            rightIcon={
              downloadAttachmentMutation.isLoading ? (
                <Spinner fontSize="1.5rem" />
              ) : (
                <BiDownload fontSize="1.5rem" />
              )
            }
          >
            {answer.value}
          </Button>
        )}
      </Text>
    </Stack>
  )
}

const DecryptedAddressRowV4 = ({
  field,
  questionNumber,
}: {
  field: FieldResponseV4
  questionNumber?: number
}): JSX.Element => {
  const answer = field.answer as AddressAnswerV4
  // Convert V4 address subfields to array in the order expected by handleAddressResponseDisplay
  const addressArray = [
    answer.blockNumber.value,
    answer.streetName.value,
    answer.buildingName.value,
    answer.levelNumber.value,
    answer.unitNumber.value,
    answer.postalCode.value,
  ]
  const transformedAddress =
    handleAddressResponseDisplay(addressArray).join(', ')
  return (
    <Stack>
      <DecryptedQuestionLabelV4 field={field} questionNumber={questionNumber} />
      <Text textStyle="body-1">{transformedAddress}</Text>
    </Stack>
  )
}

const DecryptedSignatureRowV4 = ({
  field,
  questionNumber,
}: {
  field: FieldResponseV4
  questionNumber?: number
}): JSX.Element => {
  const answer = field.answer as SignatureAnswerV4
  // RenderedSignatureCanvas expects a JSON string of the vector array
  const signatureString = JSON.stringify(answer.value)
  return (
    <Stack>
      <DecryptedQuestionLabelV4 field={field} questionNumber={questionNumber} />
      <RenderedSignatureCanvas signatureAnswer={signatureString} />
    </Stack>
  )
}

export const DecryptedRowV4 = memo(
  ({
    fieldId,
    field,
    questionNumber,
    downloadUrl,
    attachmentDecryptionKey,
  }: DecryptedRowV4Props): JSX.Element => {
    switch (field.fieldType) {
      case BasicField.Section:
        return <DecryptedHeaderRowV4 field={field} />
      case BasicField.Attachment:
        return (
          <DecryptedAttachmentRowV4
            field={field}
            questionNumber={questionNumber}
            downloadUrl={downloadUrl}
            attachmentDecryptionKey={attachmentDecryptionKey}
          />
        )
      case BasicField.Table:
        return (
          <DecryptedTableRowV4 field={field} questionNumber={questionNumber} />
        )
      case BasicField.Address:
        return (
          <DecryptedAddressRowV4
            field={field}
            questionNumber={questionNumber}
          />
        )
      case BasicField.Signature:
        return (
          <DecryptedSignatureRowV4
            field={field}
            questionNumber={questionNumber}
          />
        )
      case BasicField.Checkbox: {
        const checkboxAnswer = field.answer as CheckboxAnswerV4
        const selectedValues = checkboxAnswer.value.filter(
          (v: string) => v !== CLIENT_CHECKBOX_OTHERS_INPUT_VALUE,
        )
        const displayValue = checkboxAnswer.othersInput
          ? [...selectedValues, `Others: ${checkboxAnswer.othersInput}`].join(
              ', ',
            )
          : selectedValues.join(', ')
        return (
          <Stack>
            <DecryptedQuestionLabelV4
              field={field}
              questionNumber={questionNumber}
            />
            <Text textStyle="body-1">{displayValue}</Text>
          </Stack>
        )
      }
      case BasicField.Radio: {
        const radioAnswer = field.answer as RadioAnswerV4
        return (
          <Stack>
            <DecryptedQuestionLabelV4
              field={field}
              questionNumber={questionNumber}
            />
            <Text textStyle="body-1">{radioAnswer.value}</Text>
          </Stack>
        )
      }
      default: {
        const stringAnswer = field.answer as StringAnswerV4
        return (
          <Stack>
            <DecryptedQuestionLabelV4
              field={field}
              questionNumber={questionNumber}
            />
            {stringAnswer.value && (
              <Text textStyle="body-1">{stringAnswer.value}</Text>
            )}
          </Stack>
        )
      }
    }
  },
)
