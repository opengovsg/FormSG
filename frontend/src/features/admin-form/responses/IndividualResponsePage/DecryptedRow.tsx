import { memo, useCallback } from 'react'
import { BiDownload } from 'react-icons/bi'
import { Stack, Table, Tbody, Td, Text, Tr } from '@chakra-ui/react'

import { BasicField } from '~shared/types'

import Button from '~components/Button'
import FormLabel from '~components/FormControl/FormLabel'
import Spinner from '~components/Spinner'

import { AugmentedDecryptedResponse } from '../ResponsesPage/storage/utils/augmentDecryptedResponses'

import { useMutateDownloadAttachments } from './mutations'

export interface DecryptedRowBaseProps {
  row: AugmentedDecryptedResponse
}
type DecryptedRowProps = DecryptedRowBaseProps & {
  attachmentDecryptionKey: string
}

const DecryptedQuestionLabel = ({ row }: DecryptedRowBaseProps) => {
  return (
    <FormLabel questionNumber={`${row.questionNumber}.`} isRequired>
      {`${row.signature ? '[verified] ' : ''}${row.question}`}
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

const DecryptedAttachmentRow = ({
  row,
  attachmentDecryptionKey,
}: DecryptedRowProps) => {
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
        Filename:{' '}
        {row.answer && (
          <Button
            variant="link"
            aria-label="Download file"
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
            {row.answer}
          </Button>
        )}
      </Text>
    </Stack>
  )
}

export const DecryptedRow = memo(
  ({ row, attachmentDecryptionKey }: DecryptedRowProps): JSX.Element => {
    switch (row.fieldType) {
      case BasicField.Section:
        return <DecryptedHeaderRow row={row} />
      case BasicField.Attachment:
        return (
          <DecryptedAttachmentRow
            row={row}
            attachmentDecryptionKey={attachmentDecryptionKey}
          />
        )
      case BasicField.Table:
        return <DecryptedTableRow row={row} />
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
