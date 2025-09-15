import { Box, Divider, Text } from '@chakra-ui/react'
import { forwardRef } from 'react'
import { showOnlyWhenPrintCss } from '~utils/showOnlyWhenPrintCss'
import { useIndividualSubmission } from './queries'
import { useAdminForm } from '~features/admin-form/common/queries'
import { AugmentedDecryptedResponse } from '../ResponsesPage/storage/utils/augmentDecryptedResponses'
import { FieldType } from '@opengovsg/formsg-sdk/dist/types'
import { BasicField } from '~shared/types/field'
import { RenderedSignatureCanvas } from './RenderedSignatureCanvas'
import { handleAddressResponseDisplay } from '~shared/utils/address'

const PrintableResponseContainer = forwardRef<HTMLDivElement>((props, ref) => {
  return (
    <Box ref={ref} sx={showOnlyWhenPrintCss}>
      <PrintableResponse />
    </Box>
  )
})

export const PrintableResponseRows = ({
  decryptedResponses,
}: {
  decryptedResponses: AugmentedDecryptedResponse[]
}) => {
  return (
    <table
      style={{
        width: '100%',
        borderCollapse: 'separate',
        borderSpacing: '16px',
      }}
    >
      <tbody>
        {decryptedResponses.map((r, idx) => (
          <>
            <PrintableDivider />
            <PrintableDecryptedRow row={r} key={idx} />
          </>
        ))}
      </tbody>
    </table>
  )
}

const PrintableDivider = () => (
  <tr>
    <td colSpan={2}>
      <Divider color="gray.200" />
    </td>
  </tr>
)

const PrintableDecryptedRow = ({
  row,
}: {
  row: AugmentedDecryptedResponse
}) => {
  switch (row.fieldType as FieldType) {
    case BasicField.Section:
      return (
        <td colSpan={2} align="center">
          <Text textStyle="h3">{row.question}</Text>
        </td>
      )
    case BasicField.Address:
      const transformedAddress = handleAddressResponseDisplay(
        row.answerArray as string[],
      ).join(', ')
      return (
        <tr>
          <td width="50%">{row.question}</td>
          <td width="50%">{transformedAddress}</td>
        </tr>
      )
    case BasicField.Table:
      return (
        <>
          {row.answerArray?.map((ans, idx) => (
            <>
              {idx > 0 && <PrintableDivider />}
              {Array.isArray(ans) ? (
                <tr>
                  <td width="50%">{row.question}</td>
                  <td width="50%">{ans.join(', ')}</td>
                </tr>
              ) : (
                <tr>
                  <td width="50%">{row.question}</td>
                  <td width="50%">{ans}</td>
                </tr>
              )}
            </>
          ))}
        </>
      )
    case BasicField.Signature:
      return (
        <>
          <tr>
            <td>{row.question}</td>
          </tr>
          <tr>
            <td colSpan={2} align="center">
              <Box border="1px solid #eee">
                <RenderedSignatureCanvas row={row} />
              </Box>
            </td>
          </tr>
        </>
      )
    default:
      return (
        <tr>
          <td width="50%">{row.question}</td>
          <td width="50%">{row.answer || row.answerArray?.join(', ') || ''}</td>
        </tr>
      )
  }
}

const PrintableResponse = () => {
  const { data: form } = useAdminForm()
  const { data, isLoading, isError } = useIndividualSubmission()
  if (isLoading || isError || !data?.responses) return null
  return (
    <Box py="16px" fontFamily="sans-serif">
      <Box
        py="24px"
        w="100%"
        mb="16px"
        textAlign="center"
        bgColor="#484848"
        color="white"
      >
        <Text textStyle="h2">{form?.title}</Text>
        <Text textDecor="underline">{`${window.location.origin}/${form?._id}`}</Text>
      </Box>
      <Box mx="32px">
        <PrintableResponseRows decryptedResponses={data?.responses} />
      </Box>
    </Box>
  )
}

export default PrintableResponseContainer
