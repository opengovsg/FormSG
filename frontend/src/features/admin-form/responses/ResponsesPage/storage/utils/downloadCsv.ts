import FileSaver from 'file-saver'

export const downloadResponseAttachment = async (
  blob: Blob,
  submissionId: string,
) => {
  return FileSaver.saveAs(blob, 'RefNo ' + submissionId + '.zip')
}

export const downloadResponseAttachmentURL = async (
  blobURL: string,
  submissionId: string,
) => {
  return FileSaver.saveAs(blobURL, 'RefNo ' + submissionId + '.zip')
}
