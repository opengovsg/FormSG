import { flushSync } from 'react-dom'
import { createRoot } from 'react-dom/client'
import html2pdf from 'html2pdf.js'

import { AugmentedDecryptedResponse } from '../../ResponsesPage/storage/utils/augmentDecryptedResponses'
import PrintableResponse from '../PrintableResponse'

const A4_WIDTH = '210mm'
const A4_PDF_OPTIONS = {
  margin: 0,
  image: { type: 'jpeg', quality: 1 },
  html2canvas: { scale: 2 },
  jsPDF: {
    format: 'a4',
    orientation: 'portrait',
  },
} as const

type GenerateResponsePdfParams = {
  form: {
    title: string
    _id: string
  }
  submission: {
    refNo: string
    submissionTime: string
    responses: AugmentedDecryptedResponse[]
  }
  isAttachmentsV2Enabled: boolean
}

const renderPrintableResponse = ({
  form,
  submission,
  isAttachmentsV2Enabled,
}: GenerateResponsePdfParams) => {
  const tempDiv = document.createElement('div')
  tempDiv.style.width = A4_WIDTH
  const root = createRoot(tempDiv)

  // RATIONALE: Required to ensure the DOM is flushed before returning the div to render
  flushSync(() => {
    root.render(
      <PrintableResponse
        formTitle={form.title}
        formId={form._id}
        decryptedResponses={submission.responses}
        responseId={submission.refNo}
        submissionTime={submission.submissionTime}
        isAttachmentsV2Enabled={isAttachmentsV2Enabled}
      />,
    )
  })

  const cleanup = () => {
    root.unmount()
    tempDiv.remove()
  }
  return {
    divToRender: tempDiv,
    cleanup,
  }
}

const getPdfTitle = ({ submissionId }: { submissionId: string }) => {
  return `RefNo ${submissionId}.pdf`
}

export const generateResponsePdfBlob = async (
  params: GenerateResponsePdfParams,
) => {
  const pdfTitle = getPdfTitle({
    submissionId: params.submission.refNo,
  })

  const { divToRender, cleanup } = renderPrintableResponse(params)

  const pdfBlob = await html2pdf()
    .set(A4_PDF_OPTIONS)
    .from(divToRender)
    .output('blob')
    .finally(cleanup)

  return {
    pdfBlob,
    pdfTitle,
  }
}

export const downloadResponsePdf = async (
  params: GenerateResponsePdfParams,
) => {
  const pdfTitle = getPdfTitle({
    submissionId: params.submission.refNo,
  })

  const { divToRender, cleanup } = renderPrintableResponse(params)

  await html2pdf()
    .set(A4_PDF_OPTIONS)
    .from(divToRender)
    .save(pdfTitle)
    .finally(cleanup)
}
