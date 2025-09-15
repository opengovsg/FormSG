import { forwardRef } from 'react'
import { Box, Center, Text } from '@chakra-ui/react'
import { FieldType } from '@opengovsg/formsg-sdk/dist/types'

import { BasicField } from '~shared/types/field'
import { handleAddressResponseDisplay } from '~shared/utils/address'

import { showOnlyWhenPrintCss } from '~utils/showOnlyWhenPrintCss'

import { AugmentedDecryptedResponse } from '../ResponsesPage/storage/utils/augmentDecryptedResponses'

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
          <TableFullItem>
            <Text mb="12px">{row.question}</Text>
            <Center
              w="100%"
              borderWidth="2px"
              borderColor="secondary.200"
              display="inline-block"
            >
              <RenderedSignatureCanvas row={row} />
            </Center>
          </TableFullItem>
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

const PrintableResponse = ({
  title,
  formId,
  decryptedResponses,
}: {
  title: string
  formId: string
  decryptedResponses: AugmentedDecryptedResponse[]
}) => {
  return (
    <Box w='100%' py="16px" fontFamily="sans-serif">
      <Box
        py="24px"
        w="100%"
        mb="16px"
        textAlign="center"
        bgColor="#484848"
        color="white"
      >
        <Text textStyle="h2">{title}</Text>
        <Text textDecor="underline">{`${window.location.origin}/${formId}`}</Text>
      </Box>
      <Box mx="32px">
        <PrintableResponseRows decryptedResponses={decryptedResponses} />
      </Box>
    </Box>
  )
}

export const PrintableResponseContainer = forwardRef<
  HTMLDivElement,
  {
    title: string
    formId: string
    decryptedResponses: AugmentedDecryptedResponse[]
  }
>((props, ref) => (
  <Box
    ref={ref}
    data-printable
    sx={{
      ...showOnlyWhenPrintCss,
    }}
  >
    <PrintableResponse {...props} />
  </Box>
))

export const PdfResponseContainer = forwardRef<
  HTMLDivElement,
  {
    title: string
    formId: string
    decryptedResponses: AugmentedDecryptedResponse[]
  }
>((props, ref) => (
  <Box ref={ref}>
    <PrintableResponse {...props} />
  </Box>
))
