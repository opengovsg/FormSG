import FileSaver from 'file-saver'

export const downloadResponseAttachment = async (
  blob: Blob,
  submissionId: string,
) => {
  return FileSaver.saveAs(blob, 'RefNo ' + submissionId + '.zip')
}
