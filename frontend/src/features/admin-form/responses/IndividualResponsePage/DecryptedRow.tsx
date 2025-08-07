import { memo, useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { BiDownload } from 'react-icons/bi'
import { Box, Stack, Table, Tbody, Td, Text, Tr } from '@chakra-ui/react'
import { FieldType } from '@opengovsg/formsg-sdk/dist/types'
import getStroke from 'perfect-freehand'

import { BasicField } from '~shared/types'
import { handleAddressResponseDisplay } from '~shared/utils/address'
import {
  convertToSignatureVectorArray,
  getBoundingBox,
  signatureOutputPaddingDefault,
  signatureStrokeSize,
  signatureStrokeSmoothing,
  signatureStrokeStreamline,
  signatureStrokeThinning,
} from '~shared/utils/signature'

import { drawStroke } from '~utils/convertSignatureOutput'
import Button from '~components/Button'
import FormLabel from '~components/FormControl/FormLabel'
import Spinner from '~components/Spinner'

import { AugmentedDecryptedResponse } from '../ResponsesPage/storage/utils/augmentDecryptedResponses'

import { useMutateDownloadAttachments } from './mutations'

import { SignatureVectorArray } from '~shared/types/field'

export interface DecryptedRowBaseProps {
  row: AugmentedDecryptedResponse
}
type DecryptedRowProps = DecryptedRowBaseProps & {
  attachmentDecryptionKey: string
}

function DecryptedQuestionLabel({ row }: DecryptedRowBaseProps) {
  const { t } = useTranslation()
  return (
    <FormLabel questionNumber={`${row.questionNumber}.`} isRequired>
      {`${row.signature ? `[${t('features.common.verified')}] ` : ''}${row.question}`}
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
  const { t } = useTranslation()

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
        {t('features.common.filename')}:{' '}
        {row.answer && (
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
            {row.answer}
          </Button>
        )}
      </Text>
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
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 })

  useEffect(() => {
    const vectorArray: SignatureVectorArray = row.answerArray
      ? convertToSignatureVectorArray(row.answerArray[1] as string)
      : []

    const canvas = canvasRef.current
    if (!canvas || vectorArray.length === 0) return

    // Step 1: Compute bounding box of all x and y points
    const { minX, minY, maxX, maxY } = getBoundingBox(vectorArray)

    const padding = signatureOutputPaddingDefault
    const width = maxX - minX
    const height = maxY - minY
    const canvasWidth = width + padding * 2
    const canvasHeight = height + padding * 2

    // Step 2: Resize canvas
    canvas.width = canvasWidth
    canvas.height = canvasHeight
    setCanvasSize({ width: canvasWidth, height: canvasHeight })

    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Step 3: Draw centered strokes inside trimmed canvas
    vectorArray.forEach((stroke) => {
      const normalizedStroke = stroke.map(([x, y, pressure]) => [
        x - minX + padding,
        y - minY + padding,
        pressure,
      ])
      const pathData = getStroke(normalizedStroke, {
        size: signatureStrokeSize,
        thinning: signatureStrokeThinning,
        smoothing: signatureStrokeSmoothing,
        streamline: signatureStrokeStreamline,
      })
      drawStroke(ctx, pathData)
    })
  }, [row.answerArray])

  return (
    <Stack>
      <DecryptedQuestionLabel row={row} />
      <Box
        background="white"
        width={`${canvasSize.width}px`}
        height={`${canvasSize.height}px`}
        border="1px solid"
        borderColor="neutral.400"
        borderRadius="0.25rem"
      >
        <canvas ref={canvasRef} />
      </Box>
    </Stack>
  )
}

export const DecryptedRow = memo(
  ({ row, attachmentDecryptionKey }: DecryptedRowProps): JSX.Element => {
    switch (
      row.fieldType as FieldType
    ) {
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
