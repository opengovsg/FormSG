import { Box, Text } from '@chakra-ui/react'
import { FieldType } from '@opengovsg/formsg-sdk/dist/types'

import { BasicField } from 'formsg-shared/types/field'
import { handleAddressResponseDisplay } from 'formsg-shared/utils/address'

import { convertToSignatureSvgString } from '~utils/convertSignatureOutput'

import { AugmentedDecryptedResponse } from '../ResponsesPage/storage/utils/augmentDecryptedResponses'

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

const StandardPrintableRow = ({
  question,
  answer,
}: {
  question: string
  answer: string
}) => {
  return (
    <TableRow>
      <TableSingleColItem>{question}</TableSingleColItem>
      <TableSingleColItem>{answer}</TableSingleColItem>
    </TableRow>
  )
}

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
        <StandardPrintableRow
          question={row.question}
          answer={transformedAddress}
        />
      )
    }
    case BasicField.Table:
      return (
        <>
          {row.answerArray?.map((ans, idx) => (
            <StandardPrintableRow
              question={row.question}
              answer={Array.isArray(ans) ? ans.join(', ') : ans}
              key={idx}
            />
          ))}
        </>
      )
    case BasicField.Signature: {
      if (row.answerArray && row.answerArray.length > 1) {
        const signatureVectorArray = JSON.parse(row.answerArray[1] as string)
        const signatureSvg = convertToSignatureSvgString(signatureVectorArray)
        return (
          <TableRow>
            <TableSingleColItem>{row.question}</TableSingleColItem>
            <TableSingleColItem>
              <img
                src={`data:image/svg+xml;utf8,${encodeURIComponent(signatureSvg)}`}
                width={SIGNATURE_PDF_FIXED_WIDTH}
                alt="Signature"
              />
            </TableSingleColItem>
          </TableRow>
        )
      }
      return <></>
    }
    default:
      return (
        <StandardPrintableRow
          question={row.question}
          answer={row.answer || row.answerArray?.join(', ') || ''}
        />
      )
  }
}

const getDefaultRows = ({
  responseId,
  submissionTime,
}: {
  responseId: string
  submissionTime: string
}) => [
  {
    question: 'Response ID',
    answer: responseId,
  },
  {
    question: 'Time Submitted',
    answer: submissionTime,
  },
]

const PrintableResponseRows = ({
  decryptedResponses,
  responseId,
  submissionTime,
}: {
  decryptedResponses: AugmentedDecryptedResponse[]
  responseId: string
  submissionTime: string
}) => {
  return (
    <table
      style={{
        width: '100%',
      }}
    >
      <tbody>
        {getDefaultRows({ responseId, submissionTime }).map((r, idx) => (
          <StandardPrintableRow
            question={r.question}
            answer={r.answer}
            key={idx}
          />
        ))}
        {decryptedResponses.map((r, idx) => (
          <PrintableDecryptedRow row={r} key={idx} />
        ))}
      </tbody>
    </table>
  )
}

const isTest = import.meta.env.STORYBOOK_NODE_ENV === 'test'
const MOCK_CONSTANT_FORM_LINK = 'https://form.gov.sg/64e2f7ae841cbe0012e785e7'

export const PrintableResponse = ({
  formTitle,
  formId,
  decryptedResponses,
  responseId,
  submissionTime,
}: {
  formTitle: string
  formId: string
  decryptedResponses: AugmentedDecryptedResponse[]
  responseId: string
  submissionTime: string
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
        >
          {/* RATIONALE: Prevent noisy diffs from being detected during storybook snapshot comparisons due to dynamic form link. */}
          {isTest
            ? MOCK_CONSTANT_FORM_LINK
            : `${window.location.origin}/${formId}`}
        </Text>
      </Box>
      <Box mx="5%" my="30px">
        <PrintableResponseRows
          decryptedResponses={decryptedResponses}
          responseId={responseId}
          submissionTime={submissionTime}
        />
      </Box>
    </Box>
  )
}

export default PrintableResponse
