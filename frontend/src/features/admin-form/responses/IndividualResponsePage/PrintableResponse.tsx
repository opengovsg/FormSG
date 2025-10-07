import { forwardRef } from 'react'
import { Box, Text } from '@chakra-ui/react'
import { FieldType } from '@opengovsg/formsg-sdk/dist/types'

import { BasicField } from '~shared/types/field'
import { handleAddressResponseDisplay } from '~shared/utils/address'

import { showOnlyWhenPrintCss } from '~utils/showOnlyWhenPrintCss'

import { useAdminForm } from '~features/admin-form/common/queries'

import { AugmentedDecryptedResponse } from '../ResponsesPage/storage/utils/augmentDecryptedResponses'

import { useIndividualSubmission } from './queries'
import { SignatureCanvas } from './SignatureCanvas'

const SIGNATURE_PDF_FIXED_WIDTH = 300 // Same as the backend template's signature width

const TableRow = ({ children }: { children: React.ReactNode }) => (
  <tr
    style={{
      width: '100%',
      pageBreakInside: 'avoid' as const,
      breakInside: 'avoid' as const,
      borderTop: '1px solid',
      borderColor: '#eee',
      fontSize: '14px',
      borderCollapse: 'collapse',
    }}
  >
    {children}
  </tr>
)

const PaddingStyle = {
  padding: '8px 4px',
}

const TableFullItem = ({ children }: { children: React.ReactNode }) => (
  <td
    colSpan={2}
    style={{
      verticalAlign: 'top',
      width: '100%',
    }}
  >
    <Box {...PaddingStyle}>{children}</Box>
  </td>
)

const TableSingleColItem = ({ children }: { children: React.ReactNode }) => (
  <td
    width="50%"
    style={{
      verticalAlign: 'top',
      width: '50%',
    }}
  >
    <Box {...PaddingStyle}>{children}</Box>
  </td>
)

const PrintableDecryptedRow = ({
  row,
}: {
  row: AugmentedDecryptedResponse
}) => {
  switch (row.fieldType as FieldType) {
    case BasicField.Section:
      return (
        <TableRow>
          <TableFullItem>
            <Text style={{ fontSize: '18px', fontWeight: 500 }}>
              {row.question}
            </Text>
          </TableFullItem>
        </TableRow>
      )
    case BasicField.Address: {
      const transformedAddress = handleAddressResponseDisplay(
        row.answerArray as string[],
      ).join(', ')
      return (
        <TableRow>
          <TableSingleColItem>{row.question}</TableSingleColItem>
          <TableSingleColItem>{transformedAddress}</TableSingleColItem>
        </TableRow>
      )
    }
    case BasicField.Table:
      return (
        <>
          {row.answerArray?.map((ans, idx) => (
            <TableRow key={idx}>
              <TableSingleColItem>{row.question}</TableSingleColItem>
              <TableSingleColItem>
                {Array.isArray(ans) ? ans.join(', ') : ans}
              </TableSingleColItem>
            </TableRow>
          ))}
        </>
      )
    case BasicField.Signature:
      return (
        <TableRow>
          <TableSingleColItem>{row.question}</TableSingleColItem>
          <TableSingleColItem>
            <SignatureCanvas row={row} widthPx={SIGNATURE_PDF_FIXED_WIDTH} />
          </TableSingleColItem>
        </TableRow>
      )
    default:
      return (
        <TableRow>
          <TableSingleColItem>{row.question}</TableSingleColItem>
          <TableSingleColItem>
            {row.answer || row.answerArray?.join(', ') || ''}
          </TableSingleColItem>
        </TableRow>
      )
  }
}

const PrintableResponseRows = ({
  decryptedResponses,
}: {
  decryptedResponses: AugmentedDecryptedResponse[]
}) => {
  return (
    <table
      style={{
        width: '100%',
      }}
    >
      <tbody>
        {decryptedResponses.map((r, idx) => (
          <PrintableDecryptedRow row={r} key={idx} />
        ))}
      </tbody>
    </table>
  )
}

export const PrintableResponse = ({
  formTitle,
  formId,
  decryptedResponses,
}: {
  formTitle: string
  formId: string
  decryptedResponses: AugmentedDecryptedResponse[]
}) => {
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
        <Text style={{ fontSize: '30px' }}>{formTitle}</Text>
        <Text
          as="a"
          color="white"
          textDecor="underline"
          textDecorationColor="white"
          data-chromatic="ignore"
        >
          {window.location.origin}/{formId}
        </Text>
      </Box>
      <Box mx="5%" my="30px">
        <PrintableResponseRows decryptedResponses={decryptedResponses} />
      </Box>
    </Box>
  )
}

const PrintableResponseContainer = forwardRef<HTMLDivElement>((_, ref) => {
  const { data: form } = useAdminForm()
  const { data, isLoading, isError } = useIndividualSubmission()
  if (isLoading || isError || !form || !data?.responses) return null

  return (
    <Box ref={ref} sx={showOnlyWhenPrintCss}>
      <PrintableResponse
        formTitle={form.title}
        formId={form._id}
        decryptedResponses={data?.responses}
      />
    </Box>
  )
})

export default PrintableResponseContainer
