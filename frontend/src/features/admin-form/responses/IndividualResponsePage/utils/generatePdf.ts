import pdfMake from 'pdfmake/build/pdfmake'
import pdfFonts from 'pdfmake/build/vfs_fonts'
import { Content, TDocumentDefinitions } from 'pdfmake/interfaces'

import { BasicField } from '~shared/types'
import { handleAddressResponseDisplay } from '~shared/utils/address'

import { convertToSignatureSvgString } from '~utils/convertSignatureOutput'

import { AugmentedDecryptedResponse } from '../../ResponsesPage/storage/utils/augmentDecryptedResponses'

const isTest = import.meta.env.STORYBOOK_NODE_ENV === 'test'
const MOCK_CONSTANT_FORM_LINK = 'https://form.gov.sg/64e2f7ae841cbe0012e785e7'

const GREY_HEADER_BG_COLOR = '#484848'
const HEADER_TEXT_COLOR = 'white'
const FIELD_SEPARATOR_COLOR = '#eee'
const FIELD_CELL_PADDING = 9
const HEADER_CELL_VERTICAL_PADDING = 30

pdfMake.vfs = pdfFonts.vfs
pdfMake.tableLayouts = {
  header: {
    hLineWidth: () => 3,
    hLineColor: () => GREY_HEADER_BG_COLOR,
    vLineWidth: () => 0,
    paddingTop: (i) => (i === 0 ? HEADER_CELL_VERTICAL_PADDING : 0),
    paddingBottom: (i) => (i === 1 ? HEADER_CELL_VERTICAL_PADDING : 0),
  },
  field: {
    hLineWidth: (i) => (i > 0 ? 0 : 1),
    hLineColor: () => FIELD_SEPARATOR_COLOR,
    vLineWidth: () => 0,
    paddingTop: () => FIELD_CELL_PADDING,
    paddingBottom: () => FIELD_CELL_PADDING,
    paddingLeft: () => FIELD_CELL_PADDING,
    paddingRight: () => FIELD_CELL_PADDING,
  },
}

interface FieldRowRenderData {
  question: string
  answer: string
}

/**
 * Default rows to be included in response pdf.
 */
const getDefaultFieldRows = ({
  responseId,
  submissionTime,
}: {
  responseId: string
  submissionTime: string
}): FieldRowRenderData[] => [
  {
    question: 'Response ID',
    answer: responseId,
  },
  {
    question: 'Time Submitted',
    answer: submissionTime,
  },
]

const getStandardFieldDocDefinition = (row: FieldRowRenderData) => {
  return {
    table: {
      widths: ['*', '*'],
      body: [
        [
          { text: row.question, style: 'field' },
          { text: row.answer, style: 'field' },
        ],
      ],
    },
    layout: 'field',
    margin: [22.5, 0, 22.5, 0] as [number, number, number, number],
  }
}

const getSignatureFieldDocDefinition = (row: FieldRowRenderData) => {
  const SIGNATURE_PDF_FIXED_WIDTH_PT = 225 // Same as the backend template's signature width (px converted to pt)
  return {
    table: {
      widths: ['*', '*'],
      body: [
        [
          { text: row.question, style: 'field' },
          { svg: row.answer, width: SIGNATURE_PDF_FIXED_WIDTH_PT },
        ],
      ],
    },
    layout: 'field',
    margin: [22.5, 0, 22.5, 0] as [number, number, number, number],
  }
}

const getFieldDocDefinitionsFromResponses = ({
  fieldResponses,
}: {
  fieldResponses: AugmentedDecryptedResponse[]
}): Content[] => {
  const fieldDocDefinitions: Content[] = []
  for (const fieldResponse of fieldResponses) {
    switch (fieldResponse.fieldType) {
      case BasicField.Section:
        fieldDocDefinitions.push({
          text: fieldResponse.question,
        })
        break
      case BasicField.Address: {
        const transformedAddress = handleAddressResponseDisplay(
          fieldResponse.answerArray as string[],
        ).join(', ')
        fieldDocDefinitions.push(
          getStandardFieldDocDefinition({
            question: fieldResponse.question,
            answer: transformedAddress,
          }),
        )
        break
      }
      case BasicField.Table:
        if (fieldResponse.answerArray) {
          const tableFieldDocDefinitions = fieldResponse.answerArray.map(
            (ans) =>
              getStandardFieldDocDefinition({
                question: fieldResponse.question,
                answer: Array.isArray(ans) ? ans.join(', ') : ans,
              }),
          )
          fieldDocDefinitions.push(...tableFieldDocDefinitions)
        }
        break
      case BasicField.Signature: {
        if (
          fieldResponse.answerArray &&
          fieldResponse.answerArray.length > 1 &&
          fieldResponse.answerArray[0] === 'draw' &&
          fieldResponse.answerArray[1].length > 0
        ) {
          const signatureVectorArray = JSON.parse(
            fieldResponse.answerArray[1] as string,
          )
          fieldDocDefinitions.push(
            getSignatureFieldDocDefinition({
              question: fieldResponse.question,
              answer: convertToSignatureSvgString(signatureVectorArray),
            }),
          )
        }
        break
      }
      default:
        fieldDocDefinitions.push(
          getStandardFieldDocDefinition({
            question: fieldResponse.question,
            answer:
              fieldResponse.answer ||
              fieldResponse.answerArray?.join(', ') ||
              '',
          }),
        )
    }
  }
  return fieldDocDefinitions
}

const getDocDefinition = ({
  formTitle,
  formId,
  submissionId,
  responses,
  submissionTime,
}: ResponsePdfRenderData): TDocumentDefinitions => {
  const FORM_URL = isTest
    ? MOCK_CONSTANT_FORM_LINK
    : `${window.location.origin}/${formId}`

  return {
    styles: {
      header: {
        alignment: 'center',
        color: HEADER_TEXT_COLOR,
        fillColor: GREY_HEADER_BG_COLOR,
      },
      field: {
        alignment: 'left',
        fontSize: 10.5,
      },
    },
    content: [
      {
        table: {
          widths: ['*'],
          body: [
            [
              {
                text: formTitle,
                style: 'header',
                fontSize: 22.5,
                marginBottom: 4,
              },
            ],
            [
              {
                text: FORM_URL,
                style: 'header',
                fontSize: 8,
                decoration: 'underline',
                bold: true,
              },
            ],
          ],
        },
        layout: 'header',
        margin: [0, 0, 0, 22.5],
      },
      ...getDefaultFieldRows({ responseId: submissionId, submissionTime }).map(
        (row) => getStandardFieldDocDefinition(row),
      ),
      ...getFieldDocDefinitionsFromResponses({ fieldResponses: responses }),
    ],
    pageSize: 'A4',
    pageMargins: [0, 16],
    pageOrientation: 'portrait',
  }
}

interface ResponsePdfRenderData {
  formId: string
  formTitle: string
  submissionId: string
  responses: AugmentedDecryptedResponse[]
  submissionTime: string
}

const generatePdf = ({
  formId,
  formTitle,
  submissionId,
  responses,
  submissionTime,
}: ResponsePdfRenderData) => {
  const pdfTitle = `${formTitle}_formId_${formId}_submissionId_${submissionId}_response.pdf`

  const docDefinition = getDocDefinition({
    formId,
    formTitle,
    submissionId,
    responses,
    submissionTime,
  })
  return pdfMake.createPdf(docDefinition).download(pdfTitle)
}

export default generatePdf
