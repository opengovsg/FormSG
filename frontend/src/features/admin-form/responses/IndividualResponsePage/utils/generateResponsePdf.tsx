import { createRoot } from 'react-dom/client'
import html2pdf from 'html2pdf.js'

import { AugmentedDecryptedResponse } from '../../ResponsesPage/storage/utils/augmentDecryptedResponses'
import PrintableResponse from '../PrintableResponse'

const A4_WIDTH = '210mm'

const generateResponsePdf = async ({
  form,
  submission,
}: {
  form: {
    title: string
    _id: string
  }
  submission: {
    refNo: string
    submissionTime: string
    responses: AugmentedDecryptedResponse[]
  }
}) => {
  const tempDiv = document.createElement('div')
  tempDiv.style.width = A4_WIDTH
  const root = createRoot(tempDiv)
  root.render(
    <PrintableResponse
      formTitle={form.title}
      formId={form._id}
      decryptedResponses={submission.responses}
      responseId={submission.refNo}
      submissionTime={submission.submissionTime}
    />,
  )

  const pdfTitle = `${form.title}_formId_${form._id}_submissionId_${submission.refNo}_response.pdf`
  await html2pdf()
    .set({
      margin: 0,
      image: { type: 'jpeg', quality: 1 },
      html2canvas: { scale: 2 },
      filename: pdfTitle,
      jsPDF: {
        format: 'a4',
        orientation: 'portrait',
      },
    })
    .from(tempDiv)
    .save(pdfTitle)
    .finally(() => {
      root.unmount()
      tempDiv.remove()
    })
}

export default generateResponsePdf
