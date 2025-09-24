import { forwardRef } from 'react'
import { Box, Center, Text } from '@chakra-ui/react'
import { FieldType } from '@opengovsg/formsg-sdk/dist/types'

import { BasicField } from '~shared/types/field'
import { handleAddressResponseDisplay } from '~shared/utils/address'

import { showOnlyWhenPrintCss } from '~utils/showOnlyWhenPrintCss'

import { useAdminForm } from '~features/admin-form/common/queries'

import { AugmentedDecryptedResponse } from '../ResponsesPage/storage/utils/augmentDecryptedResponses'

import { useIndividualSubmission } from './queries'
import { RenderedSignatureCanvas } from './RenderedSignatureCanvas'

const TableRow = ({ children }: { children: React.ReactNode }) => (
  <tr
    style={{
      width: '100%',
      pageBreakInside: 'avoid' as const,
      breakInside: 'avoid' as const,
      borderTop: '1px solid',
      borderColor: '#eee',
    }}
  >
    {children}
  </tr>
)

const PaddingStyle = {
  paddingTop: '24px',
  paddingBottom: '24px',
}

const TableFullItem = ({ children }: { children: React.ReactNode }) => (
  <td
    colSpan={2}
    style={{
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
            <Text align="center" textStyle="h3">
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
          <TableSingleColItem>
            {row.question}
          </TableSingleColItem>
          <TableSingleColItem>
            <Center
              width="100%"
              display="block"
            >
              <RenderedSignatureCanvas row={row} />
            </Center>
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

const PrintableResponseContainer = forwardRef<HTMLDivElement>((props, ref) => {
  return (
    <Box ref={ref} sx={showOnlyWhenPrintCss}>
      <PrintableResponse />
    </Box>
  )
})

export default PrintableResponseContainer
